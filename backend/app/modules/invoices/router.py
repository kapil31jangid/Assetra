from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import current_claims, require_roles
from app.modules.invoices.models import Invoice, InvoiceLine
from app.modules.rentals.models import RentalOrder

router = APIRouter()


# ---------------------------------------------------------------------------
# Serialiser
# ---------------------------------------------------------------------------

def invoice_payload(invoice: Invoice) -> dict:
    return {
        "id": invoice.id,
        "number": invoice.number,
        "orderId": invoice.order_id,
        "customer": invoice.customer_snapshot,
        "status": invoice.status,
        "paymentStatus": invoice.payment_status,
        "amountPaid": float(invoice.amount_paid),
        "subtotal": {"amount": float(invoice.subtotal_amount), "currency": invoice.subtotal_currency},
        "tax": {"amount": float(invoice.tax_amount), "currency": invoice.tax_currency},
        "total": {"amount": float(invoice.total_amount), "currency": invoice.total_currency},
        "dueAt": invoice.due_at.isoformat() if invoice.due_at else None,
        "issuedAt": invoice.issued_at.isoformat() if invoice.issued_at else None,
        "createdAt": invoice.created_at.isoformat(),
        "lines": [
            {
                "id": line.id,
                "description": line.description,
                "quantity": line.quantity,
                "unitPrice": {
                    "amount": float(line.unit_price_amount),
                    "currency": line.unit_price_currency,
                },
                "total": {
                    "amount": float(line.total_amount),
                    "currency": line.total_currency,
                },
            }
            for line in invoice.lines
        ],
    }


async def _next_invoice_number(db: AsyncSession) -> str:
    """Generate an auto-incrementing number in INV/YYYY/NNNN format."""
    year = datetime.now(UTC).year
    prefix = f"INV/{year}/"
    count = (
        await db.scalar(
            select(func.count(Invoice.id)).where(Invoice.number.like(f"{prefix}%"))
        )
    ) or 0
    return f"{prefix}{count + 1:04d}"


# ---------------------------------------------------------------------------
# List & get
# ---------------------------------------------------------------------------

@router.get("")
async def list_invoices(
    page: int = 1,
    pageSize: int = 20,
    search: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    query = (
        select(Invoice)
        .options(selectinload(Invoice.lines), selectinload(Invoice.order))
        .order_by(Invoice.created_at.desc())
    )
    if claims.get("role") == "customer":
        # Customers see only invoices linked to their own orders
        query = query.join(Invoice.order).where(
            Invoice.order.has(customer_user_id=claims["sub"])
        )
    elif claims.get("role") == "vendor":
        # Vendors see only invoices for orders they own
        query = query.join(Invoice.order).where(
            Invoice.order.has(vendor_id=claims["sub"])
        )
    if status:
        query = query.where(Invoice.payment_status == status)
    if search:
        query = query.where(
            or_(
                Invoice.number.ilike(f"%{search}%"),
                Invoice.customer_snapshot["name"].as_string().ilike(f"%{search}%"),
            )
        )
    result = await db.scalars(query)
    return paginated_envelope(
        [invoice_payload(item) for item in result.unique().all()],
        page=page,
        page_size=pageSize,
    )


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    invoice = await db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.lines), selectinload(Invoice.order))
        .where(Invoice.id == invoice_id)
    )
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice could not be found.")
    # Ownership check
    role = claims.get("role")
    if role == "customer" and (
        invoice.order is None or invoice.order.customer_user_id != claims["sub"]
    ):
        raise HTTPException(status_code=404, detail="Invoice could not be found.")
    if role == "vendor" and invoice.order is not None and invoice.order.vendor_id != claims["sub"]:
        raise HTTPException(status_code=403, detail="You do not have permission for this invoice.")
    return envelope(invoice_payload(invoice))


# ---------------------------------------------------------------------------
# Create (draft invoice from an order)
# ---------------------------------------------------------------------------

class InvoiceCreateRequest(BaseModel):
    orderId: str
    dueDays: int = Field(default=7, ge=0)


@router.post("", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_invoice(
    request: InvoiceCreateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    order = await db.scalar(
        select(RentalOrder)
        .options(selectinload(RentalOrder.lines), selectinload(RentalOrder.invoices))
        .where(RentalOrder.id == request.orderId)
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order not found.")
    # Idempotency: return existing draft invoice if one already exists
    existing = next((inv for inv in order.invoices if inv.status == "draft"), None)
    if existing:
        existing_full = await db.scalar(
            select(Invoice).options(selectinload(Invoice.lines)).where(Invoice.id == existing.id)
        )
        return envelope(invoice_payload(existing_full))

    subtotal = float(order.price.get("rental", {}).get("amount", 0))
    tax = float(order.price.get("tax", {}).get("amount", 0))
    total = subtotal + tax
    number = await _next_invoice_number(db)

    invoice = Invoice(
        id=new_id("inv"),
        number=number,
        order_id=order.id,
        customer_snapshot=order.customer_snapshot,
        status="draft",
        payment_status="unpaid",
        amount_paid=0,
        subtotal_amount=subtotal,
        subtotal_currency="INR",
        tax_amount=tax,
        tax_currency="INR",
        total_amount=total,
        total_currency="INR",
        due_at=date.today().replace(day=date.today().day + request.dueDays)
        if request.dueDays
        else None,
    )

    # Mirror order lines into invoice lines
    for line in order.lines:
        invoice.lines.append(
            InvoiceLine(
                id=new_id("invl"),
                description=f"{line.product_name} — {line.rental_quantity} {line.rental_unit}(s)",
                quantity=line.quantity,
                unit_price_amount=float(line.unit_price_amount),
                unit_price_currency=line.unit_price_currency,
                total_amount=float(line.line_total_amount),
                total_currency=line.line_total_currency,
            )
        )

    db.add(invoice)
    await db.commit()
    result = await db.scalar(
        select(Invoice).options(selectinload(Invoice.lines)).where(Invoice.id == invoice.id)
    )
    return envelope(invoice_payload(result))


# ---------------------------------------------------------------------------
# Confirm (draft → posted)
# ---------------------------------------------------------------------------

@router.post("/{invoice_id}/confirm", dependencies=[Depends(require_roles("admin", "vendor"))])
async def confirm_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    invoice = await db.scalar(
        select(Invoice).options(selectinload(Invoice.lines)).where(Invoice.id == invoice_id)
    )
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    if invoice.status != "draft":
        raise HTTPException(status_code=409, detail=f"Invoice is already '{invoice.status}'.")
    invoice.status = "posted"
    invoice.issued_at = datetime.now(UTC)
    await db.commit()
    return envelope(invoice_payload(invoice))


# ---------------------------------------------------------------------------
# Record a payment against an invoice
# ---------------------------------------------------------------------------

class InvoicePaymentRequest(BaseModel):
    amount: float = Field(gt=0)
    method: str = "card"  # card | cash | bank_transfer | upi
    note: str | None = None


@router.post("/{invoice_id}/payments", dependencies=[Depends(require_roles("admin", "vendor"))])
async def record_payment(
    invoice_id: str,
    request: InvoicePaymentRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    invoice = await db.scalar(
        select(Invoice).options(selectinload(Invoice.lines)).where(Invoice.id == invoice_id)
    )
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    if invoice.status != "posted":
        raise HTTPException(status_code=409, detail="Only posted invoices can accept payments.")
    if invoice.payment_status == "paid":
        raise HTTPException(status_code=409, detail="Invoice is already fully paid.")

    total = float(invoice.total_amount)
    new_paid = float(invoice.amount_paid) + request.amount
    if new_paid > total + 0.01:  # 1-paise tolerance for floating-point rounding
        raise HTTPException(
            status_code=422,
            detail=f"Payment amount ₹{request.amount} exceeds remaining balance ₹{total - float(invoice.amount_paid):.2f}.",
        )

    invoice.amount_paid = new_paid
    if new_paid >= total - 0.01:
        invoice.payment_status = "paid"
    else:
        invoice.payment_status = "partially_paid"

    await db.commit()
    return envelope({
        **invoice_payload(invoice),
        "paymentRecorded": {"amount": request.amount, "method": request.method, "note": request.note},
    })


from app.modules.invoices.pdf import generate_invoice_pdf

# ---------------------------------------------------------------------------
# Download (PDF invoice)
# ---------------------------------------------------------------------------

@router.get("/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> Response:
    body = await get_invoice(invoice_id, db, claims)
    data = body["data"]
    
    pdf_bytes = generate_invoice_pdf(data)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{data["number"].replace("/", "_")}.pdf"'
        },
    )
