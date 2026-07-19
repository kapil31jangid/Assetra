"""
Stock overlap validation service.

Checks whether a requested quantity of a variant is truly available during
a specific rental window, accounting for other in-flight bookings whose
rental periods overlap with the requested window.

"Overlap" definition (standard interval overlap):
  existing.starts_at < requested.ends_at AND existing.ends_at > requested.starts_at

Statuses that consume stock (i.e. count toward overlap):
  reserved, picked_up, late_pickup, late_return
  (quotation/quotation_sent/confirmed/invoiced do NOT consume physical stock yet)
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.models import ProductVariant
from app.modules.rentals.models import RentalOrder, RentalOrderLine

# Statuses that hold physical stock during a rental window
STOCK_HOLDING_STATUSES = {"reserved", "picked_up", "late_pickup", "late_return"}


async def check_variant_availability(
    db: AsyncSession,
    variant_id: str,
    requested_qty: int,
    starts_at: datetime,
    ends_at: datetime,
    exclude_order_id: str | None = None,
) -> tuple[bool, int]:
    """
    Returns (is_available, units_already_booked_in_window).

    Args:
        db:               Async DB session.
        variant_id:       The variant to check.
        requested_qty:    How many units the customer wants.
        starts_at:        Rental window start.
        ends_at:          Rental window end.
        exclude_order_id: If editing an existing order, exclude its own lines from the count.

    Returns:
        (True, booked_count) if sufficient stock is available.
        (False, booked_count) if insufficient — caller raises 409.
    """
    variant = await db.get(ProductVariant, variant_id)
    if variant is None:
        return False, 0

    # Query overlapping lines in stock-holding orders
    overlap_query = (
        select(RentalOrderLine)
        .join(RentalOrder, RentalOrderLine.order_id == RentalOrder.id)
        .where(
            and_(
                RentalOrderLine.variant_id == variant_id,
                RentalOrder.status.in_(STOCK_HOLDING_STATUSES),
                # Overlap condition: starts_at < ends_at_of_other AND ends_at > starts_at_of_other
                RentalOrderLine.rental_starts_at < ends_at,
                RentalOrderLine.rental_ends_at > starts_at,
            )
        )
    )
    if exclude_order_id:
        overlap_query = overlap_query.where(RentalOrderLine.order_id != exclude_order_id)

    overlapping_lines = list((await db.scalars(overlap_query)).all())
    booked_qty = sum(line.quantity for line in overlapping_lines)
    available = variant.stock_total - booked_qty

    return available >= requested_qty, booked_qty
