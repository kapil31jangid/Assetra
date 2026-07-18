from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.security import current_claims
from app.core.seed_data import ORDERS, clone_list
from app.modules.rentals.models import RentalOrder

router = APIRouter()


def summary(orders: list[dict], from_date: str, to_date: str) -> dict:
    counts: dict[str, int] = {}
    for order in orders:
        counts[order["status"]] = counts.get(order["status"], 0) + 1
    deposit_held = sum(float(order.get("price", {}).get("deposit", {}).get("amount", 0)) for order in orders if order.get("status") not in {"returned", "cancelled"})
    revenue = sum(float(order.get("price", {}).get("rental", {}).get("amount", 0)) for order in orders if order.get("status") not in {"draft", "quotation", "cancelled"})
    return {"period": {"from": from_date, "to": to_date}, "kpis": [{"key": "revenue", "label": "Revenue", "value": revenue, "formattedValue": f"Rs. {revenue:,.0f}", "currency": "INR", "trend": "flat"}, {"key": "active_rentals", "label": "Active Rentals", "value": sum(counts.get(s, 0) for s in ("reserved", "picked_up", "late_return")), "formattedValue": str(sum(counts.get(s, 0) for s in ("reserved", "picked_up", "late_return"))), "trend": "flat"}, {"key": "pending_orders", "label": "Pending Orders", "value": counts.get("quotation", 0) + counts.get("confirmed", 0), "formattedValue": str(counts.get("quotation", 0) + counts.get("confirmed", 0)), "trend": "flat"}, {"key": "deposit_held", "label": "Deposit Held", "value": deposit_held, "formattedValue": f"Rs. {deposit_held:,.0f}", "currency": "INR", "trend": "flat"}], "orderStatusCounts": counts, "upcomingPickups": orders, "upcomingReturns": orders}


@router.get("/summary")
async def dashboard_summary(date_from: Annotated[str | None, Query(alias="from")] = None, to: str | None = None, db: AsyncSession = Depends(get_db_session), claims: dict | None = Depends(current_claims)) -> dict:
    from_date = date_from or date.today().replace(day=1).isoformat()
    to_date = to or date.today().isoformat()
    if not isinstance(db, AsyncSession):
        return envelope(summary(clone_list(ORDERS), from_date, to_date))
    result = await db.scalars(select(RentalOrder).options(selectinload(RentalOrder.lines), selectinload(RentalOrder.fulfillment_events), selectinload(RentalOrder.invoices)).order_by(RentalOrder.created_at.desc()).limit(1000))
    orders = [{"id": order.id, "number": order.number, "status": order.status, "customer": order.customer_snapshot, "schedule": order.schedule, "price": order.price, "deposit": order.deposit, "lateFees": order.late_fees, "lines": []} for order in result.unique().all()]
    return envelope(summary(orders, from_date, to_date))
