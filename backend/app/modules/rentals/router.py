from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.responses import envelope, paginated_envelope
from app.core.seed_data import ORDERS, PRODUCTS, clone_item, clone_list, inr, new_id, now_iso
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


def find_order(order_id: str) -> dict[str, Any]:
    order = next((item for item in ORDERS if item["id"] == order_id), None)
    if order is None:
        raise HTTPException(status_code=404, detail="Rental order could not be found.")
    return order


def build_line(request_line: CreateRentalOrderLineRequest) -> dict[str, Any]:
    product = next((item for item in PRODUCTS if item["id"] == request_line.productId), None)
    if product is None:
        raise HTTPException(status_code=400, detail=f"Product {request_line.productId} was not found.")

    variant = next(
        (item for item in product["variants"] if item["id"] == request_line.variantId),
        None,
    )
    if variant is None:
        raise HTTPException(status_code=400, detail=f"Variant {request_line.variantId} was not found.")

    unit_price = 2500
    period_quantity = int(request_line.rentalPeriod.get("quantity", 1))
    line_total = unit_price * request_line.quantity * period_quantity

    return {
        "id": new_id("line"),
        "productId": product["id"],
        "variantId": variant["id"],
        "productName": product["name"],
        "variantName": variant["name"],
        "sku": variant["sku"],
        "quantity": request_line.quantity,
        "rentalPeriod": request_line.rentalPeriod,
        "unitPrice": inr(unit_price),
        "lineTotal": inr(line_total),
        "accessories": clone_list(product.get("accessories", [])),
    }


@router.get("")
async def list_orders(
    page: int = 1,
    pageSize: int = 20,
    status: list[str] | None = None,
    customerId: str | None = None,
    productId: str | None = None,
) -> dict:
    orders = clone_list(ORDERS)

    if status:
        statuses = set(status)
        orders = [order for order in orders if order["status"] in statuses]
    if customerId:
        orders = [order for order in orders if order["customer"]["id"] == customerId]
    if productId:
        orders = [
            order for order in orders if any(line["productId"] == productId for line in order["lines"])
        ]

    return paginated_envelope(orders, page=page, page_size=pageSize)


@router.get("/{order_id}")
async def get_order(order_id: str) -> dict:
    return envelope(clone_item(find_order(order_id)))


@router.post("")
async def create_order(request: CreateRentalOrderRequest) -> dict:
    lines = [build_line(line) for line in request.lines]
    rental_total = sum(line["lineTotal"]["amount"] for line in lines)
    deposit_total = sum(
        next(product for product in PRODUCTS if product["id"] == line["productId"])["depositPolicy"][
            "amount"
        ]["amount"]
        for line in lines
    )
    tax = round(rental_total * 0.18, 2)
    now = now_iso()

    order = {
        "id": new_id("ord"),
        "number": f"RO-{datetime.now(UTC).strftime('%y%m%d')}-{len(ORDERS) + 1:03d}",
        "customer": {"id": request.customerId, "name": "New Customer", "email": "customer@example.com"},
        "vendorId": "ven_01",
        "status": "quotation",
        "lines": lines,
        "schedule": request.schedule,
        "price": {
            "rental": inr(rental_total),
            "delivery": inr(0),
            "discount": inr(0),
            "deposit": inr(deposit_total),
            "tax": inr(tax),
            "total": inr(rental_total + deposit_total + tax),
        },
        "deposit": {
            "required": deposit_total > 0,
            "amount": inr(deposit_total),
            "refundable": True,
            "refundWindowDays": 3,
        },
        "depositTransactions": [],
        "lateFees": [],
        "damageReports": [],
        "fulfillmentEvents": [],
        "invoiceIds": [],
        "createdAt": now,
        "updatedAt": now,
    }
    ORDERS.append(order)

    return envelope(clone_item(order))


@router.post("/{order_id}/status")
async def update_order_status(order_id: str, request: UpdateRentalOrderStatusRequest) -> dict:
    order = find_order(order_id)
    allowed_statuses = RENTAL_ORDER_STATUS_TRANSITIONS.get(order["status"], set())

    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition order from {order['status']} to {request.status}.",
        )

    order["status"] = request.status
    order["updatedAt"] = now_iso()

    return envelope(clone_item(order))
