from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.models import Organization
from app.core.security import current_claims, require_roles
from app.modules.fulfillment.models import FulfillmentEvent
from app.modules.invoices.models import InvoiceLine
from app.modules.payments.models import LateFeeAssessment
from app.modules.payments.service import calculate_late_fee
from app.modules.catalog.models import ProductVariant
from app.modules.rentals.models import RentalOrder
from app.modules.rentals.service import order_payload, parse_dt

router = APIRouter()


class RecordFulfillmentRequest(BaseModel):
    type: Literal["pickup", "return"]
    occurredAt: str
    checklist: list[dict[str, Any]] = Field(default_factory=list)
    notes: str | None = None
    photos: list[str] = Field(default_factory=list)
    damageAmount: float = Field(default=0, ge=0)
    damageNotes: str | None = None


@router.post("/{order_id}/fulfillment", dependencies=[Depends(require_roles("admin", "vendor"))])
async def record_fulfillment(
    order_id: str,
    request: RecordFulfillmentRequest,
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
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order could not be found.")

    if request.type == "pickup" and order.status not in {"reserved", "late_pickup"}:
        raise HTTPException(status_code=409, detail="This order is not ready for pickup")
    if request.type == "return" and order.status not in {"picked_up", "late_return"}:
        raise HTTPException(status_code=409, detail="This order is not ready for return")
    if not request.checklist:
        raise HTTPException(status_code=422, detail="A pickup or return checklist is required")

    occurred_at = parse_dt(request.occurredAt)
    event = FulfillmentEvent(
        id=new_id("ful"),
        order_id=order.id,
        type=request.type,
        occurred_at=occurred_at,
        recorded_by_snapshot={"id": claims["sub"], "role": claims["role"]},
        checklist=request.checklist,
        notes=request.notes,
        photos=request.photos,
    )
    db.add(event)

    if request.type == "pickup":
        order.status = "picked_up"
        order.schedule = {**order.schedule, "actualPickupAt": request.occurredAt}

    else:  # return
        scheduled = parse_dt(order.schedule["scheduledReturnAt"])
        grace = int(order.schedule.get("gracePeriodMinutes", 0))
        minutes_late = max(0, int((occurred_at - scheduled).total_seconds() // 60) - grace)

        if minutes_late:
            # Fetch org-level late fee settings instead of using a hardcoded constant
            org = await db.scalar(select(Organization).where(Organization.active.is_(True)))
            fee_unit = org.late_fee_unit if org else "hourly"
            fee_rate = float(org.late_fee_amount) if org else 250.0
            fee_max = float(org.late_fee_maximum) if org and org.late_fee_maximum else None

            amount = calculate_late_fee(minutes_late, fee_unit, fee_rate, fee_max)
            fee = LateFeeAssessment(
                id=new_id("fee"),
                order_id=order.id,
                minutes_late=minutes_late,
                amount=amount,
                currency="INR",
                status="assessed",
                note="Automatic late return assessment",
            )
            db.add(fee)
            order.late_fees = [
                *order.late_fees,
                {
                    "id": fee.id,
                    "amount": {"amount": amount, "currency": "INR"},
                    "minutesLate": minutes_late,
                    "status": "assessed",
                },
            ]

            # Inject late fee as a line item into the linked invoice
            invoice = next(iter(order.invoices), None)
            if invoice:
                late_fee_line = InvoiceLine(
                    id=new_id("invl"),
                    invoice_id=invoice.id,
                    description=f"Late return fee ({minutes_late} min late, {fee_unit} rate)",
                    quantity=1,
                    unit_price_amount=amount,
                    unit_price_currency="INR",
                    total_amount=amount,
                    total_currency="INR",
                )
                db.add(late_fee_line)
                # Recalculate invoice total
                invoice.total_amount = float(invoice.subtotal_amount) + float(invoice.tax_amount) + amount

        order.status = "returned"
        order.schedule = {**order.schedule, "actualReturnAt": request.occurredAt}

        # Restore stock: move units from stock_in_use back to stock_available
        for line in order.lines:
            variant = await db.get(ProductVariant, line.variant_id)
            if variant:
                qty = line.quantity
                variant.stock_in_use = max(0, variant.stock_in_use - qty)
                variant.stock_available += qty

        if request.damageAmount:
            order.damage_reports = [
                *order.damage_reports,
                {
                    "amount": {"amount": request.damageAmount, "currency": "INR"},
                    "notes": request.damageNotes,
                    "status": "assessed",
                },
            ]

    await db.commit()
    await db.refresh(order)
    return envelope(order_payload(order))
