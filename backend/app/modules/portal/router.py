"""
Atomic checkout completion endpoint.

POST /portal/checkout/complete

Executes the full checkout transaction in a single DB commit:
  1. Resolve prices via pricelist (with 5-level tie-break cascade)
  2. Create RentalOrder with all lines
  3. Auto-create a posted Invoice (INV/YYYY/NNNN)
  4. Stub the payment through SandboxPaymentProvider
  5. Decrement stock (stock_available, stock_reserved) on each variant
  6. Write a DepositTransaction row (the authoritative record; order JSON is derived from this)
  7. Set order status to 'reserved'
"""

from datetime import UTC, date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.models import Organization
from app.core.security import current_claims, require_roles
from app.modules.auth.models import User
from app.modules.catalog.availability import check_variant_availability
from app.modules.catalog.models import Product, ProductVariant
from app.modules.invoices.models import Invoice, InvoiceLine
from app.modules.payments.models import DepositTransaction, Payment
from app.modules.payments.provider import SandboxPaymentProvider
from app.modules.pricing.models import Pricelist
from app.modules.pricing.service import resolve_price
from app.modules.rentals.models import RentalOrder, RentalOrderLine
from app.modules.rentals.service import order_payload, parse_dt

router = APIRouter()
_provider = SandboxPaymentProvider()


class CheckoutLineRequest(BaseModel):
    productId: str
    variantId: str
    quantity: int = Field(gt=0)
    rentalPeriod: dict[str, Any]


class CheckoutAddressRequest(BaseModel):
    name: str
    line1: str
    line2: str | None = None
    city: str
    state: str | None = None
    postalCode: str
    countryCode: str = "IN"
    phone: str | None = None


class CheckoutRequest(BaseModel):
    lines: list[CheckoutLineRequest] = Field(min_length=1)
    deliveryMethod: str = "pickup"  # 'pickup' | 'delivery'
    deliveryAddress: CheckoutAddressRequest | None = None
    pricelistId: str | None = None
    couponCode: str | None = None
    idempotencyKey: str | None = None


async def _next_invoice_number(db: AsyncSession) -> str:
    year = datetime.now(UTC).year
    prefix = f"INV/{year}/"
    count = (
        await db.scalar(
            select(func.count(Invoice.id)).where(Invoice.number.like(f"{prefix}%"))
        )
    ) or 0
    return f"{prefix}{count + 1:04d}"


async def _next_order_number(db: AsyncSession) -> str:
    count = (await db.scalar(select(func.count(RentalOrder.id)))) or 0
    return f"RO-{datetime.now(UTC).strftime('%y%m%d')}-{count + 1:03d}"


@router.post("/checkout/complete", dependencies=[Depends(require_roles("admin", "vendor", "customer"))])
async def checkout_complete(
    request: CheckoutRequest,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    # ── Idempotency: if this key already exists, return the previous result ──
    if request.idempotencyKey:
        existing_payment = await db.scalar(
            select(Payment).where(Payment.idempotency_key == request.idempotencyKey)
        )
        if existing_payment and existing_payment.order_id:
            order = await db.scalar(
                select(RentalOrder)
                .options(
                    selectinload(RentalOrder.lines),
                    selectinload(RentalOrder.fulfillment_events),
                    selectinload(RentalOrder.invoices),
                )
                .where(RentalOrder.id == existing_payment.order_id)
            )
            if order:
                return envelope({"order": order_payload(order), "idempotent": True})

    # ── Fetch customer ──
    customer = await db.get(User, claims["sub"])
    if customer is None or not customer.active:
        raise HTTPException(status_code=400, detail="Customer account not found.")

    # ── Fetch org settings (tax rate, deposit rules) ──
    org = await db.scalar(select(Organization).where(Organization.active.is_(True)))
    tax_rate = float(org.tax_rate) / 100 if org else 0.18

    # ── Fetch pricelists for price resolution ──
    pricelist_query = select(Pricelist).options(
        selectinload(Pricelist.rules)  # type: ignore[arg-type]
    ).where(Pricelist.active.is_(True))
    if request.pricelistId:
        pricelist_query = pricelist_query.where(Pricelist.id == request.pricelistId)
    pricelists = list((await db.scalars(pricelist_query)).all())

    # ── Build order lines with resolved pricing ──
    order_lines: list[RentalOrderLine] = []
    rental_total = 0.0
    deposit_total = 0.0
    today = date.today()

    for req_line in request.lines:
        product = await db.scalar(
            select(Product).options(selectinload(Product.variants)).where(Product.id == req_line.productId)
        )
        if product is None or not product.active:
            raise HTTPException(
                status_code=400, detail=f"Product '{req_line.productId}' is unavailable."
            )
        variant = await db.get(ProductVariant, req_line.variantId)
        if variant is None or variant.product_id != product.id:
            raise HTTPException(
                status_code=400, detail=f"Variant '{req_line.variantId}' not found."
            )

        period = req_line.rentalPeriod
        rental_qty = int(period.get("quantity", 1))
        rental_unit = period.get("unit", "daily")

        # ── Overlap-aware stock validation ──
        if product.product_type == "goods":
            available, booked = await check_variant_availability(
                db=db,
                variant_id=variant.id,
                requested_qty=req_line.quantity,
                starts_at=starts_at,
                ends_at=ends_at,
            )
            if not available:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Insufficient availability for '{product.name}' during the requested period. "
                        f"Already booked: {booked}, requested: {req_line.quantity}."
                    ),
                )

        # ── Price resolution with 5-level tie-break ──
        unit_price = resolve_price(
            pricelists=pricelists,
            product_id=product.id,
            variant_id=variant.id,
            rental_unit=rental_unit,
            quantity=req_line.quantity,
            rental_date=today,
            sales_price=float(product.sales_price),
        )
        line_total = unit_price * req_line.quantity * rental_qty
        rental_total += line_total
        deposit_total += float(product.deposit_amount) * req_line.quantity

        starts_at = parse_dt(period["startsAt"])
        ends_at = parse_dt(period["endsAt"])

        order_lines.append(
            RentalOrderLine(
                id=new_id("line"),
                product_id=product.id,
                variant_id=variant.id,
                product_name=product.name,
                variant_name=variant.name,
                sku=variant.sku,
                quantity=req_line.quantity,
                rental_starts_at=starts_at,
                rental_ends_at=ends_at,
                rental_unit=rental_unit,
                rental_quantity=rental_qty,
                rental_timezone=period.get("timezone", "Asia/Kolkata"),
                unit_price_amount=unit_price,
                unit_price_currency="INR",
                line_total_amount=line_total,
                line_total_currency="INR",
                accessories_snapshot=product.accessories,
            )
        )

    delivery_fee = 0.0  # configurable in future
    tax = round(rental_total * tax_rate, 2)
    grand_total = rental_total + deposit_total + delivery_fee + tax

    # ── Create order ──
    schedule: dict[str, Any] = {
        "mode": "store_pickup" if request.deliveryMethod == "pickup" else "delivery",
        "scheduledPickupAt": request.lines[0].rentalPeriod["startsAt"],
        "scheduledReturnAt": request.lines[0].rentalPeriod["endsAt"],
        "gracePeriodMinutes": org.grace_period_minutes if org else 0,
    }
    if request.deliveryAddress:
        schedule["deliveryAddress"] = request.deliveryAddress.model_dump()

    order = RentalOrder(
        id=new_id("ord"),
        number=await _next_order_number(db),
        customer_user_id=customer.id,
        customer_snapshot={"id": customer.id, "name": customer.name, "email": customer.email},
        status="reserved",
        schedule=schedule,
        price={
            "rental": {"amount": rental_total, "currency": "INR"},
            "delivery": {"amount": delivery_fee, "currency": "INR"},
            "discount": {"amount": 0, "currency": "INR"},
            "deposit": {"amount": deposit_total, "currency": "INR"},
            "tax": {"amount": tax, "currency": "INR"},
            "total": {"amount": grand_total, "currency": "INR"},
        },
        deposit={
            "required": deposit_total > 0,
            "amount": {"amount": deposit_total, "currency": "INR"},
            "refundable": True,
            "refundWindowDays": org.deposit_refund_window_days if org else 3,
        },
        deposit_transactions=[],   # populated from DepositTransaction rows below
        late_fees=[],
        damage_reports=[],
        lines=order_lines,
    )
    db.add(order)
    await db.flush()  # get order.id before creating related records

    # ── Decrement stock on each variant (authoritative DB update) ──
    for req_line in request.lines:
        variant = await db.get(ProductVariant, req_line.variantId)
        if variant and variant.product_id:
            product = await db.get(Product, variant.product_id)
            if product and product.product_type == "goods":
                variant.stock_available = max(0, variant.stock_available - req_line.quantity)
                variant.stock_reserved += req_line.quantity

    # ── Stub payment ──
    idempotency_key = request.idempotencyKey or f"checkout_{new_id('idem')}"
    payment_result = _provider.authorize(grand_total, "INR", idempotency_key)
    payment = Payment(
        id=new_id("pay"),
        order_id=order.id,
        user_id=customer.id,
        provider=_provider.name,
        provider_reference=payment_result.reference,
        kind="rental_and_deposit",
        status=payment_result.status,
        amount=grand_total,
        currency="INR",
        idempotency_key=idempotency_key,
        processed_at=datetime.now(UTC),
    )
    db.add(payment)
    await db.flush()

    # ── DepositTransaction (authoritative — this is the single source of truth) ──
    if deposit_total > 0:
        dep_tx = DepositTransaction(
            id=new_id("dep"),
            order_id=order.id,
            payment_id=payment.id,
            type="hold",
            amount=deposit_total,
            currency="INR",
            note="Security deposit held at checkout",
        )
        db.add(dep_tx)
        await db.flush()
        # Sync the order's deposit_transactions JSON from the DB record (one canonical write)
        order.deposit_transactions = [
            {
                "id": dep_tx.id,
                "type": dep_tx.type,
                "amount": {"amount": float(dep_tx.amount), "currency": dep_tx.currency},
                "note": dep_tx.note,
                "createdAt": datetime.now(UTC).isoformat(),
            }
        ]

    # ── Create posted invoice ──
    invoice_number = await _next_invoice_number(db)
    invoice = Invoice(
        id=new_id("inv"),
        number=invoice_number,
        order_id=order.id,
        customer_snapshot=order.customer_snapshot,
        status="posted",
        payment_status="paid" if payment_result.status == "succeeded" else "unpaid",
        amount_paid=grand_total if payment_result.status == "succeeded" else 0,
        subtotal_amount=rental_total,
        subtotal_currency="INR",
        tax_amount=tax,
        tax_currency="INR",
        total_amount=rental_total + tax,
        total_currency="INR",
        issued_at=datetime.now(UTC),
        due_at=date.today(),
    )
    for ol in order.lines:
        invoice.lines.append(
            InvoiceLine(
                id=new_id("invl"),
                description=f"{ol.product_name} — {ol.rental_quantity} {ol.rental_unit}(s)",
                quantity=ol.quantity,
                unit_price_amount=float(ol.unit_price_amount),
                unit_price_currency=ol.unit_price_currency,
                total_amount=float(ol.line_total_amount),
                total_currency=ol.line_total_currency,
            )
        )
    db.add(invoice)

    # ── Commit all at once ──
    await db.commit()

    # ── Return full order payload ──
    full_order = await db.scalar(
        select(RentalOrder)
        .options(
            selectinload(RentalOrder.lines),
            selectinload(RentalOrder.fulfillment_events),
            selectinload(RentalOrder.invoices),
        )
        .where(RentalOrder.id == order.id)
    )
    return envelope({
        "order": order_payload(full_order),
        "invoiceNumber": invoice_number,
        "paymentReference": payment_result.reference,
        "paymentStatus": payment_result.status,
        "idempotent": False,
    })
