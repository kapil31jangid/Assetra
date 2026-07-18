from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.security import current_claims
from app.modules.rentals.models import RentalOrder

router = APIRouter()


def _build_kpis(orders: list, from_date: str, to_date: str) -> dict:
    """Build dashboard KPI payload from a list of order dicts."""
    counts: dict[str, int] = {}
    for order in orders:
        counts[order["status"]] = counts.get(order["status"], 0) + 1

    active_statuses = {"reserved", "picked_up", "late_return"}
    deposit_held = sum(
        float(o.get("price", {}).get("deposit", {}).get("amount", 0))
        for o in orders
        if o.get("status") not in {"returned", "cancelled"}
    )
    revenue = sum(
        float(o.get("price", {}).get("rental", {}).get("amount", 0))
        for o in orders
        if o.get("status") not in {"draft", "quotation", "cancelled"}
    )
    late_fees = sum(
        sum(float(fee.get("amount", {}).get("amount", 0)) for fee in o.get("lateFees", []))
        for o in orders
    )

    return {
        "period": {"from": from_date, "to": to_date},
        "kpis": [
            {"key": "revenue", "label": "Revenue", "value": revenue, "formattedValue": f"₹{revenue:,.0f}", "currency": "INR", "trend": "flat"},
            {"key": "active_rentals", "label": "Active Rentals", "value": sum(counts.get(s, 0) for s in active_statuses), "formattedValue": str(sum(counts.get(s, 0) for s in active_statuses)), "trend": "flat"},
            {"key": "pending_orders", "label": "Pending Orders", "value": counts.get("quotation", 0) + counts.get("quotation_sent", 0), "formattedValue": str(counts.get("quotation", 0) + counts.get("quotation_sent", 0)), "trend": "flat"},
            {"key": "deposit_held", "label": "Deposit Held", "value": deposit_held, "formattedValue": f"₹{deposit_held:,.0f}", "currency": "INR", "trend": "flat"},
            {"key": "overdue", "label": "Overdue Rentals", "value": counts.get("late_return", 0) + counts.get("late_pickup", 0), "formattedValue": str(counts.get("late_return", 0) + counts.get("late_pickup", 0)), "trend": "flat"},
            {"key": "late_fee_collected", "label": "Late Fees Collected", "value": late_fees, "formattedValue": f"₹{late_fees:,.0f}", "currency": "INR", "trend": "flat"},
        ],
        "orderStatusCounts": counts,
    }


@router.get("/summary")
async def dashboard_summary(
    date_from: str | None = None,
    to: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    from_date = date_from or date.today().replace(day=1).isoformat()
    to_date = to or date.today().isoformat()

    # Only load what the summary function actually needs — no eager-loading of
    # fulfillment_events or invoices since they are not used here.
    query = (
        select(RentalOrder)
        .order_by(RentalOrder.created_at.desc())
        .limit(2000)
    )
    # Vendor scoping: vendors see only their own orders
    if claims.get("role") == "vendor":
        query = query.where(RentalOrder.vendor_id == claims["sub"])

    result = await db.scalars(query)
    orders = [
        {
            "id": order.id,
            "number": order.number,
            "status": order.status,
            "customer": order.customer_snapshot,
            "schedule": order.schedule,
            "price": order.price,
            "deposit": order.deposit,
            "lateFees": order.late_fees,
        }
        for order in result.all()
    ]
    return envelope(_build_kpis(orders, from_date, to_date))
