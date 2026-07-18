from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import current_claims, require_roles
from app.core.seed_data import ORDERS, clone_item, new_id as legacy_id, now_iso
from app.modules.fulfillment.models import FulfillmentEvent
from app.modules.payments.models import LateFeeAssessment
from app.modules.payments.service import calculate_late_fee
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


def legacy_order(order_id: str) -> dict:
    order = next((item for item in ORDERS if item["id"] == order_id), None)
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order could not be found.")
    return order


@router.post("/{order_id}/fulfillment", dependencies=[Depends(require_roles("admin", "vendor"))])
async def record_fulfillment(order_id: str, request: RecordFulfillmentRequest, db: AsyncSession = Depends(get_db_session), claims: dict = Depends(current_claims)) -> dict:
    if not isinstance(db, AsyncSession):
        order = legacy_order(order_id)
        event = {"id": legacy_id("ful"), "type": request.type, "occurredAt": request.occurredAt, "recordedBy": {"id": "usr_vendor", "name": "Operations", "email": "vendor@assetra.local", "role": "vendor"}, "checklist": request.checklist, "notes": request.notes, "photos": request.photos}
        order["fulfillmentEvents"].append(event)
        order["updatedAt"] = now_iso()
        if request.type == "pickup" and order["status"] in {"reserved", "late_pickup"}:
            order["status"] = "picked_up"
            order["schedule"]["actualPickupAt"] = request.occurredAt
        if request.type == "return" and order["status"] in {"picked_up", "late_return"}:
            order["status"] = "returned"
            order["schedule"]["actualReturnAt"] = request.occurredAt
        return envelope(clone_item(order))
    order = await db.scalar(select(RentalOrder).options(selectinload(RentalOrder.lines), selectinload(RentalOrder.fulfillment_events), selectinload(RentalOrder.invoices)).where(RentalOrder.id == order_id))
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order could not be found.")
    if request.type == "pickup" and order.status not in {"reserved", "late_pickup"}:
        raise HTTPException(status_code=409, detail="This order is not ready for pickup")
    if request.type == "return" and order.status not in {"picked_up", "late_return"}:
        raise HTTPException(status_code=409, detail="This order is not ready for return")
    if not request.checklist:
        raise HTTPException(status_code=422, detail="A pickup or return checklist is required")
    occurred_at = parse_dt(request.occurredAt)
    event = FulfillmentEvent(id=new_id("ful"), order_id=order.id, type=request.type, occurred_at=occurred_at, recorded_by_snapshot={"id": claims["sub"], "role": claims["role"]}, checklist=request.checklist, notes=request.notes, photos=request.photos)
    db.add(event)
    if request.type == "pickup":
        order.status = "picked_up"
        order.schedule = {**order.schedule, "actualPickupAt": request.occurredAt}
    else:
        scheduled = parse_dt(order.schedule["scheduledReturnAt"])
        grace = int(order.schedule.get("gracePeriodMinutes", 0))
        minutes_late = max(0, int((occurred_at - scheduled).total_seconds() // 60) - grace)
        if minutes_late:
            amount = calculate_late_fee(minutes_late, "hourly", 250)
            fee = LateFeeAssessment(id=new_id("fee"), order_id=order.id, minutes_late=minutes_late, amount=amount, currency="INR", status="assessed", note="Automatic late return assessment")
            db.add(fee)
            order.late_fees = [*order.late_fees, {"id": fee.id, "amount": {"amount": amount, "currency": "INR"}, "minutesLate": minutes_late, "status": "assessed"}]
            order.status = "returned"
        else:
            order.status = "returned"
        order.schedule = {**order.schedule, "actualReturnAt": request.occurredAt}
        if request.damageAmount:
            order.damage_reports = [*order.damage_reports, {"amount": {"amount": request.damageAmount, "currency": "INR"}, "notes": request.damageNotes, "status": "assessed"}]
    await db.commit()
    await db.refresh(order)
    return envelope(order_payload(order))
