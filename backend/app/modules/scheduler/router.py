"""
Scheduler endpoint.

GET /scheduler?year=YYYY&month=MM

Returns per-day booking aggregation for a calendar month view.
Each day entry shows the count of orders active on that day
(i.e., their rental window overlaps the day), broken down by status.

No new schema is required — this queries existing RentalOrderLine start/end dates.
"""

from calendar import monthrange
from datetime import UTC, date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.security import current_claims
from app.modules.rentals.models import RentalOrder, RentalOrderLine

router = APIRouter()


@router.get("")
async def get_schedule(
    year: int = 0,
    month: int = 0,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    today = date.today()
    y = year or today.year
    m = month or today.month

    # Clamp to valid range
    m = max(1, min(12, m))
    _, days_in_month = monthrange(y, m)

    month_start = date(y, m, 1)
    month_end = date(y, m, days_in_month)
    month_start_dt = datetime.combine(month_start, time.min, tzinfo=UTC)
    month_end_dt = datetime.combine(month_end, time.max, tzinfo=UTC)

    # Fetch all order lines whose rental window overlaps this month
    query = (
        select(RentalOrderLine)
        .join(RentalOrderLine.order)
        .where(
            # Overlapping interval: line starts before month end AND ends after month start
            RentalOrderLine.rental_starts_at <= month_end_dt,
            RentalOrderLine.rental_ends_at >= month_start_dt,
            # Exclude terminal statuses from calendar
            RentalOrder.status.notin_({"cancelled"}),
        )
    )
    # Vendor scoping: vendors only see their own orders on the calendar
    if claims.get("role") == "vendor":
        query = query.where(RentalOrder.vendor_id == claims["sub"])

    lines = list((await db.scalars(query)).all())

    # Aggregate per day
    days: list[dict] = []
    for day_num in range(1, days_in_month + 1):
        day = date(y, m, day_num)
        day_lines = [
            ln for ln in lines
            if ln.rental_starts_at.date() <= day <= ln.rental_ends_at.date()
        ]
        # Fetch order statuses for these lines (order is joined above but not loaded)
        order_ids = {ln.order_id for ln in day_lines}

        # Count by variant unique orders (not line items) to avoid double-count
        days.append({
            "date": day.isoformat(),
            "totalBookings": len(order_ids),
            "lineCount": len(day_lines),
            "orderIds": list(order_ids),
        })

    # Also return per-order detail for orders active this month
    order_ids_month = {ln.order_id for ln in lines}
    orders = []
    if order_ids_month:
        order_rows = await db.scalars(
            select(RentalOrder).where(RentalOrder.id.in_(order_ids_month))
        )
        for order in order_rows.all():
            orders.append({
                "id": order.id,
                "number": order.number,
                "status": order.status,
                "customer": order.customer_snapshot,
                "schedule": order.schedule,
            })

    return envelope({
        "year": y,
        "month": m,
        "daysInMonth": days_in_month,
        "days": days,
        "orders": orders,
    })
