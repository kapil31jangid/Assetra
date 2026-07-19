"""Imports all SQLAlchemy models so Alembic can discover metadata."""

from app.core.models import Organization
from app.modules.attributes.models import Attribute, AttributeValue, ProductAttribute
from app.modules.auth.models import Address, User, UserSession
from app.modules.catalog.models import Product, ProductCategory, ProductVariant
from app.modules.fulfillment.models import FulfillmentEvent
from app.modules.invoices.models import Invoice, InvoiceLine
from app.modules.pricing.models import Pricelist, PricingRule
from app.modules.payments.models import DepositTransaction, LateFeeAssessment, Payment
from app.modules.quotations.models import Quotation, QuotationLine, QuotationTemplate
from app.modules.rentals.models import RentalOrder, RentalOrderLine


__all__ = [
    "Address",
    "Attribute",
    "AttributeValue",
    "DepositTransaction",
    "FulfillmentEvent",
    "Invoice",
    "InvoiceLine",
    "LateFeeAssessment",
    "Organization",
    "Payment",
    "Pricelist",
    "PricingRule",
    "Product",
    "ProductAttribute",
    "ProductCategory",
    "ProductVariant",
    "Quotation",
    "QuotationLine",
    "QuotationTemplate",
    "RentalOrder",
    "RentalOrderLine",
    "User",
    "UserSession",
]
