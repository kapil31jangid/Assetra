from app.core.model_registry import *  # noqa: F403
from app.core.models import Base


def test_database_metadata_contains_core_tables() -> None:
    assert set(Base.metadata.tables) >= {
        "users",
        "product_categories",
        "products",
        "product_variants",
        "pricelists",
        "pricing_rules",
        "rental_orders",
        "rental_order_lines",
        "fulfillment_events",
        "invoices",
        "invoice_lines",
    }
