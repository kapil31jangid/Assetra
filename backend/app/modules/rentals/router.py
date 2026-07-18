from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import current_claims, require_roles
from app.modules.catalog.models import Product, ProductVariant
from app.modules.auth.models import User
from app.modules.rentals.models import RentalOrder, RentalOrderLine
from app.modules.rentals.service import order_payload, parse_dt
from app.modules.rentals.status import RENTAL_ORDER_STATUS_TRANSITIONS

router = APIRouter()


class CreateRentalOrderLineRequest(BaseModel):
    productId: str
    variantId: str
    quantity: int = Field(gt=0)
    rentalPeriod: dict[str, Any]


class CreateRentalOrderRequest(BaseModel):
    customerId: str
    lines: list[CreateRentalOrderLineRequest] = Field(min_length=1)
    schedule: dict[str, Any]
    pricelistId: str | None = None


class UpdateRentalOrderStatusRequest(BaseModel):
    status: str
    note: str | None = None


@router.get("")
async def list_orders(
    page: int = 1,
    pageSize: int = 20,
    status: list[str] | None = None,
    customerId: str | None = None,
    productId: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    query = (
        select(RentalOrder)
        .options(
            selectinload(RentalOrder.lines),
            selectinload(RentalOrder.fulfillment_events),
            selectinload(RentalOrder.invoices),
        )
        .order_by(RentalOrder.created_at.desc())
    )
    if claims.get("role") == "customer":
        query = query.where(RentalOrder.customer_user_id == claims["sub"])
    elif customerId:
        query = query.where(RentalOrder.customer_user_id == customerId)
    if status:
        query = query.where(RentalOrder.status.in_(status))
    if productId:
        query = query.join(RentalOrderLine).where(RentalOrderLine.product_id == productId)
    result = await db.scalars(query)
    return paginated_envelope(
        [order_payload(order) for order in result.unique().all()],
        page=page,
        page_size=pageSize,
    )


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    order = await db.scalar(
        select(RentalOrder)
        .options(
            selectinload(RentalOrder.lines),
            selectinload(RentalOrder.fulfillment_events),
            selectinload(RentalOrder.invoices),
        )
        .where(RentalOrder.id == order_id)
    )
    if order is None or (
        claims.get("role") == "customer" and order.customer_user_id != claims["sub"]
    ):
        raise HTTPException(status_code=404, detail="Rental order could not be found.")
    return envelope(order_payload(order))


@router.post("", dependencies=[Depends(require_roles("admin", "vendor", "customer"))])
async def create_order(
    request: CreateRentalOrderRequest,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    customer_id = claims["sub"] if claims.get("role") == "customer" else request.customerId
    customer = await db.get(User, customer_id)
    if customer is None or not customer.active:
        raise HTTPException(status_code=400, detail="Customer account was not found")

    lines = []
    rental_total = 0.0
    deposit_total = 0.0

    for request_line in request.lines:
        product = await db.get(Product, request_line.productId)
        if product is None or not product.active:
            raise HTTPException(
                status_code=400, detail=f"Product {request_line.productId} is unavailable"
            )
        variant = await db.get(ProductVariant, request_line.variantId)
        if variant is None or variant.product_id != product.id:
            raise HTTPException(
                status_code=400, detail=f"Variant {request_line.variantId} was not found"
            )

        period = request_line.rentalPeriod
        rental_qty = int(period.get("quantity", 1))

        # TODO: resolve unit_price via Pricelist price-resolution function
        # For now fall back to 0 — the checkout completion endpoint does proper price resolution.
        unit_price = 0.0
        line_total = unit_price * request_line.quantity * rental_qty
        rental_total += line_total
        deposit_total += float(product.deposit_amount) * request_line.quantity

        lines.append(
            RentalOrderLine(
                id=new_id("line"),
                product_id=product.id,
                variant_id=variant.id,
                product_name=product.name,
                variant_name=variant.name,
                sku=variant.sku,
                quantity=request_line.quantity,
                rental_starts_at=parse_dt(period["startsAt"]),
                rental_ends_at=parse_dt(period["endsAt"]),
                rental_unit=period.get("unit", "daily"),
                rental_quantity=rental_qty,
                rental_timezone=period.get("timezone", "Asia/Kolkata"),
                unit_price_amount=unit_price,
                unit_price_currency="INR",
                line_total_amount=line_total,
                line_total_currency="INR",
                accessories_snapshot=product.accessories,
            )
        )

    tax = round(rental_total * 0.18, 2)
    order_count = (await db.scalar(select(func.count(RentalOrder.id)))) or 0
    order = RentalOrder(
        id=new_id("ord"),
        number=f"RO-{datetime.now(UTC).strftime('%y%m%d')}-{order_count + 1:03d}",
        customer_user_id=customer.id,
        customer_snapshot={"id": customer.id, "name": customer.name, "email": customer.email},
        vendor_id=None,
        status="quotation",
        schedule=request.schedule,
        price={
            "rental": {"amount": rental_total, "currency": "INR"},
            "delivery": {"amount": 0, "currency": "INR"},
            "discount": {"amount": 0, "currency": "INR"},
            "deposit": {"amount": deposit_total, "currency": "INR"},
            "tax": {"amount": tax, "currency": "INR"},
            "total": {"amount": rental_total + deposit_total + tax, "currency": "INR"},
        },
        deposit={
            "required": deposit_total > 0,
            "amount": {"amount": deposit_total, "currency": "INR"},
            "refundable": True,
            "refundWindowDays": 3,
        },
        deposit_transactions=[],
        late_fees=[],
        damage_reports=[],
        lines=lines,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return envelope(order_payload(order))


@router.post("/{order_id}/status", dependencies=[Depends(require_roles("admin", "vendor"))])
async def update_order_status(
    order_id: str,
    request: UpdateRentalOrderStatusRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    order = await db.scalar(
        select(RentalOrder)
        .options(
            selectinload(RentalOrder.lines),
            selectinload(RentalOrder.fulfillment_events),
            selectinload(RentalOrder.invoices),
        )
        .where(RentalOrder.id == order_id)
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order could not be found.")
    if request.status not in RENTAL_ORDER_STATUS_TRANSITIONS.get(order.status, set()):
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition order from {order.status} to {request.status}.",
        )
    order.status = request.status
    await db.commit()
    return envelope(order_payload(order))
