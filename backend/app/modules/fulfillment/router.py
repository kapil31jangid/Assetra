from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.responses import envelope
from app.core.seed_data import ORDERS, clone_item, new_id, now_iso


router = APIRouter()


class RecordFulfillmentRequest(BaseModel):
    type: Literal["pickup", "return"]
    occurredAt: str
    checklist: list[dict[str, Any]]
    notes: str | None = None
    photos: list[str] | None = None


def find_order(order_id: str) -> dict[str, Any]:
    order = next((item for item in ORDERS if item["id"] == order_id), None)
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order could not be found.")
    return order


@router.post("/{order_id}/fulfillment")
async def record_fulfillment(order_id: str, request: RecordFulfillmentRequest) -> dict:
    order = find_order(order_id)
    event = {
        "id": new_id("ful"),
        "type": request.type,
        "occurredAt": request.occurredAt,
        "recordedBy": {
            "id": "usr_vendor",
            "name": "Kabir Sethi",
            "email": "vendor@assetra.local",
            "role": "vendor",
        },
        "checklist": request.checklist,
        "notes": request.notes,
        "photos": request.photos or [],
    }

    order["fulfillmentEvents"].append(event)
    order["updatedAt"] = now_iso()

    if request.type == "pickup" and order["status"] in {"reserved", "late_pickup"}:
        order["status"] = "picked_up"
        order["schedule"]["actualPickupAt"] = request.occurredAt
    if request.type == "return" and order["status"] in {"picked_up", "late_return"}:
        order["status"] = "returned"
        order["schedule"]["actualReturnAt"] = request.occurredAt

    return envelope(clone_item(order))
