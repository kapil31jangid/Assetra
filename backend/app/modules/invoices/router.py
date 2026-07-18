from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.security import current_claims
from app.modules.invoices.models import Invoice

router = APIRouter()


def invoice_payload(invoice: Invoice) -> dict:
    return {
        "id": invoice.id,
        "number": invoice.number,
        "orderId": invoice.order_id,
        "customer": invoice.customer_snapshot,
        "status": invoice.status,
        "subtotal": {"amount": float(invoice.subtotal_amount), "currency": invoice.subtotal_currency},
        "tax": {"amount": float(invoice.tax_amount), "currency": invoice.tax_currency},
        "total": {"amount": float(invoice.total_amount), "currency": invoice.total_currency},
        "dueAt": invoice.due_at.isoformat() if invoice.due_at else None,
        "issuedAt": invoice.issued_at.isoformat() if invoice.issued_at else None,
        "lines": [
            {
                "id": line.id,
                "description": line.description,
                "quantity": line.quantity,
                "unitPrice": {"amount": float(line.unit_price_amount), "currency": line.unit_price_currency},
                "total": {"amount": float(line.total_amount), "currency": line.total_currency},
            }
            for line in invoice.lines
        ],
    }


@router.get("")
async def list_invoices(
    page: int = 1,
    pageSize: int = 20,
    search: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    query = (
        select(Invoice)
        .options(selectinload(Invoice.lines), selectinload(Invoice.order))
        .order_by(Invoice.created_at.desc())
    )
    if claims.get("role") == "customer":
        query = query.join(Invoice.order).where(
            Invoice.order.has(customer_user_id=claims["sub"])
        )
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
    if invoice is None or (
        claims.get("role") == "customer"
        and (invoice.order is None or invoice.order.customer_user_id != claims["sub"])
    ):
        raise HTTPException(status_code=404, detail="Invoice could not be found.")
    return envelope(invoice_payload(invoice))


@router.get("/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> Response:
    body = await get_invoice(invoice_id, db, claims)
    data = body["data"]
    lines = "".join(
        f"{line['description']} x {line['quantity']} = "
        f"{line['total']['amount']} {line['total']['currency']}\n"
        for line in data.get("lines", [])
    )
    content = (
        f"Assetra Invoice {data['number']}\n"
        f"Customer: {data['customer'].get('name', '')}\n\n"
        f"{lines}\n"
        f"Total: {data['total']['amount']} {data['total']['currency']}\n"
    )
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={data['number']}.txt"},
    )
