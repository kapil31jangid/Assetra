"""
Reports endpoint.

GET /reports/summary?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&status=&vendorId=

Returns aggregated financial and operational metrics for a date range.
Vendor-scoped automatically: admin sees all; vendor sees only their own orders.
"""

from datetime import UTC, date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.security import current_claims
from app.modules.invoices.models import Invoice
from app.modules.payments.models import LateFeeAssessment
from app.modules.rentals.models import RentalOrder

router = APIRouter()


@router.get("/summary")
async def reports_summary(
    from_date: str | None = None,
    to_date: str | None = None,
    status: str | None = None,
    vendorId: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    f = date.fromisoformat(from_date) if from_date else date.today().replace(day=1)
    t = date.fromisoformat(to_date) if to_date else date.today()
    from_dt = datetime.combine(f, time.min, tzinfo=UTC)
    to_dt = datetime.combine(t, time.max, tzinfo=UTC)

    # ── Orders query ──
    order_query = (
        select(RentalOrder)
        .where(
            RentalOrder.created_at >= from_dt,
            RentalOrder.created_at <= to_dt,
        )
        .order_by(RentalOrder.created_at.desc())
    )
    # Role-based scoping: vendors only see their own orders
    if claims.get("role") == "vendor":
        order_query = order_query.where(RentalOrder.vendor_id == claims["sub"])
    elif vendorId:
        order_query = order_query.where(RentalOrder.vendor_id == vendorId)
    if status:
        order_query = order_query.where(RentalOrder.status == status)

    orders = list((await db.scalars(order_query)).all())

    # ── Aggregate order metrics ──
    status_counts: dict[str, int] = {}
    revenue_total = 0.0
    deposit_held = 0.0
    active_statuses = {"reserved", "picked_up", "late_return", "late_pickup"}
    terminal_statuses = {"returned", "cancelled"}

    for order in orders:
        status_counts[order.status] = status_counts.get(order.status, 0) + 1
        rental_amt = float(order.price.get("rental", {}).get("amount", 0))
        deposit_amt = float(order.price.get("deposit", {}).get("amount", 0))
        if order.status not in {"draft", "quotation", "cancelled"}:
            revenue_total += rental_amt
        if order.status not in terminal_statuses:
            deposit_held += deposit_amt

    active_count = sum(status_counts.get(s, 0) for s in active_statuses)
    overdue_count = status_counts.get("late_return", 0) + status_counts.get("late_pickup", 0)

    # ── Late fees ──
    order_ids = [o.id for o in orders]
    late_fee_total = 0.0
    late_fee_pending = 0.0
    if order_ids:
        fee_rows = await db.scalars(
            select(LateFeeAssessment).where(LateFeeAssessment.order_id.in_(order_ids))
        )
        for fee in fee_rows.all():
            late_fee_total += float(fee.amount)
            if fee.status == "assessed":
                late_fee_pending += float(fee.amount)

    # ── Invoice payment status ──
    invoices_paid = 0
    invoices_unpaid = 0
    invoices_partial = 0
    if order_ids:
        inv_rows = await db.scalars(
            select(Invoice).where(Invoice.order_id.in_(order_ids))
        )
        for inv in inv_rows.all():
            if inv.payment_status == "paid":
                invoices_paid += 1
            elif inv.payment_status == "partially_paid":
                invoices_partial += 1
            else:
                invoices_unpaid += 1

    # ── Status breakdown for chart ──
    all_statuses = [
        "draft", "quotation", "quotation_sent", "confirmed", "invoiced",
        "reserved", "picked_up", "late_pickup", "late_return", "returned", "cancelled",
    ]
    status_breakdown = [
        {"status": s, "count": status_counts.get(s, 0)}
        for s in all_statuses
    ]

    return envelope({
        "period": {"from": f.isoformat(), "to": t.isoformat()},
        "kpis": {
            "totalOrders": len(orders),
            "activeRentals": active_count,
            "overdueRentals": overdue_count,
            "revenue": {"amount": revenue_total, "currency": "INR"},
            "depositHeld": {"amount": deposit_held, "currency": "INR"},
            "lateFeeTotal": {"amount": late_fee_total, "currency": "INR"},
            "lateFeePending": {"amount": late_fee_pending, "currency": "INR"},
        },
        "invoices": {
            "paid": invoices_paid,
            "partiallyPaid": invoices_partial,
            "unpaid": invoices_unpaid,
        },
        "statusBreakdown": status_breakdown,
    })


@router.get("/orders")
async def reports_orders(
    from_date: str | None = None,
    to_date: str | None = None,
    status: str | None = None,
    page: int = 1,
    pageSize: int = 50,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    """Paginated order list scoped to the same date/status filters as the summary."""
    from app.api.responses import paginated_envelope
    from app.modules.rentals.service import order_payload
    from sqlalchemy.orm import selectinload

    f = date.fromisoformat(from_date) if from_date else date.today().replace(day=1)
    t = date.fromisoformat(to_date) if to_date else date.today()

    query = (
        select(RentalOrder)
        .options(
            selectinload(RentalOrder.lines),
            selectinload(RentalOrder.fulfillment_events),
            selectinload(RentalOrder.invoices),
        )
        .where(
            RentalOrder.created_at >= f.isoformat(),
            RentalOrder.created_at <= f"{t.isoformat()}T23:59:59",
        )
        .order_by(RentalOrder.created_at.desc())
    )
    if claims.get("role") == "vendor":
        query = query.where(RentalOrder.vendor_id == claims["sub"])
    if status:
        query = query.where(RentalOrder.status == status)

    result = await db.scalars(query)
    return paginated_envelope(
        [order_payload(o) for o in result.unique().all()],
        page=page,
        page_size=pageSize,
    )
