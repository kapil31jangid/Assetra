"""Imports all SQLAlchemy models so Alembic can discover metadata."""

from app.modules.auth.models import User
from app.modules.catalog.models import Product, ProductCategory, ProductVariant
from app.modules.fulfillment.models import FulfillmentEvent
from app.modules.invoices.models import Invoice, InvoiceLine
from app.modules.pricing.models import Pricelist, PricingRule
from app.modules.rentals.models import RentalOrder, RentalOrderLine


__all__ = [
    "FulfillmentEvent",
    "Invoice",
    "InvoiceLine",
    "Pricelist",
    "PricingRule",
    "Product",
    "ProductCategory",
    "ProductVariant",
    "RentalOrder",
    "RentalOrderLine",
    "User",
]
