from typing import Annotated

from fastapi import APIRouter, Query

from app.api.responses import envelope
from app.core.seed_data import ORDERS, clone_list


router = APIRouter()


@router.get("/summary")
async def dashboard_summary(
    date_from: Annotated[str | None, Query(alias="from")] = None,
    to: str | None = None,
) -> dict:
    orders = clone_list(ORDERS)
    status_counts: dict[str, int] = {}
    for order in orders:
        status_counts[order["status"]] = status_counts.get(order["status"], 0) + 1

    deposit_held = sum(order["price"]["deposit"]["amount"] for order in orders)

    return envelope(
        {
            "period": {"from": date_from or "2026-07-01", "to": to or "2026-07-31"},
            "kpis": [
                {
                    "key": "revenue",
                    "label": "Revenue",
                    "value": 284000,
                    "formattedValue": "Rs. 2.84L",
                    "currency": "INR",
                    "changePercent": 12,
                    "trend": "up",
                },
                {
                    "key": "active_rentals",
                    "label": "Active Rentals",
                    "value": len(orders),
                    "formattedValue": str(len(orders)),
                    "changePercent": 4,
                    "trend": "up",
                },
                {
                    "key": "pending_orders",
                    "label": "Pending Orders",
                    "value": status_counts.get("quotation", 0) + status_counts.get("confirmed", 0),
                    "formattedValue": str(
                        status_counts.get("quotation", 0) + status_counts.get("confirmed", 0)
                    ),
                    "changePercent": -3,
                    "trend": "down",
                },
                {
                    "key": "deposit_held",
                    "label": "Deposit Held",
                    "value": deposit_held,
                    "formattedValue": f"Rs. {deposit_held:,.0f}",
                    "currency": "INR",
                    "trend": "flat",
                },
            ],
            "orderStatusCounts": status_counts,
            "upcomingPickups": orders,
            "upcomingReturns": orders,
        }
    )
