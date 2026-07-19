"""
Price resolution service.

Tie-break cascade for overlapping pricelist rules (most specific wins):
  1. Specificity: variant-scoped > product-scoped > all-products (product_id IS NULL)
  2. Validity window: narrower window (both from+to set) > open-ended (one or both NULL)
  3. Minimum quantity: higher minimum wins (more targeted bulk pricing)
  4. Final price: lower computed price wins (customer-favorable)
  5. Last resort: most recently created rule (newest config takes precedence)

The function returns the resolved unit price for ONE period unit.
The caller multiplies by rental_quantity to get the line total.
"""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.pricing.models import Pricelist, PricingRule


def _rule_specificity(rule: "PricingRule") -> int:
    """Higher = more specific = higher priority."""
    if rule.variant_id is not None:
        return 3
    if rule.product_id is not None:
        return 2
    return 1  # all-products rule


def _rule_window_score(rule: "PricingRule") -> int:
    """Higher = narrower window = higher priority."""
    if rule.valid_from is not None and rule.valid_to is not None:
        return 2
    if rule.valid_from is not None or rule.valid_to is not None:
        return 1
    return 0


def _compute_price(rule: "PricingRule", base_price: float, pricelist_currency: str) -> float:
    """Compute the final unit price from a rule. Returns 0 if not computable."""
    if rule.kind == "fixed_price" and rule.fixed_price_amount is not None:
        return float(rule.fixed_price_amount)
    if rule.kind == "discount_percent" and rule.discount_percent is not None:
        return base_price * (1 - float(rule.discount_percent) / 100)
    return base_price


def resolve_price(
    pricelists: list["Pricelist"],
    product_id: str,
    variant_id: str | None,
    rental_unit: str,
    quantity: int,
    rental_date: date,
    sales_price: float,
) -> float:
    """
    Return the resolved unit price for a single rental-period unit.

    Args:
        pricelists:   All active Pricelist objects (with rules eagerly loaded).
        product_id:   The product being priced.
        variant_id:   The specific variant (may be None).
        rental_unit:  'hourly' | 'daily' | 'nightly' | 'weekly' | 'monthly'
        quantity:     Number of units requested (used for minimum_quantity check).
        rental_date:  The rental start date (used for validity window check).
        sales_price:  Product.sales_price — the authoritative fallback base price.

    Returns:
        Resolved unit price as a float. Falls back to sales_price if no rule matches.
    """
    candidates: list[tuple[int, int, int, float, str, "PricingRule"]] = []

    for pricelist in pricelists:
        for rule in pricelist.rules:
            # Must match rental unit
            if rule.period_unit != rental_unit:
                continue
            # Must satisfy minimum quantity
            if rule.minimum_quantity > quantity:
                continue
            # Must be within validity window (if set)
            if rule.valid_from is not None and rental_date < rule.valid_from:
                continue
            if rule.valid_to is not None and rental_date > rule.valid_to:
                continue
            # Must target this product/variant or be an all-products rule
            if rule.product_id is not None and rule.product_id != product_id:
                continue
            if rule.variant_id is not None and rule.variant_id != variant_id:
                continue

            price = _compute_price(rule, sales_price, pricelist.currency)
            spec = _rule_specificity(rule)
            window = _rule_window_score(rule)
            min_q = rule.minimum_quantity

            # Sort key: (specificity DESC, window DESC, min_qty DESC, price ASC, created_at DESC)
            # We store as a tuple for min() — invert booleans/signs accordingly
            sort_key = (
                -spec,          # negate: higher specificity → lower sort value → wins
                -window,        # negate: narrower window → wins
                -min_q,         # negate: higher min_qty → wins
                price,          # lower price → wins
                rule.created_at.timestamp() * -1 if rule.created_at else 0,  # newer → wins
            )
            candidates.append((*sort_key, price, rule))  # type: ignore[arg-type]

    if not candidates:
        # No rule matched — fall back to product's configured sales_price
        return sales_price

    # Pick the candidate with the lexicographically smallest sort key
    winner = min(candidates, key=lambda c: c[:5])
    return winner[5]  # resolved price
