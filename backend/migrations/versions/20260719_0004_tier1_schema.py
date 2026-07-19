"""Tier 1 schema additions: invoice payment tracking, product sales_price and type."""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260719_0004"
down_revision: str | Sequence[str] | None = "20260718_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- invoices ---
    op.add_column(
        "invoices",
        sa.Column(
            "payment_status",
            sa.String(32),
            nullable=False,
            server_default="unpaid",
        ),
    )
    op.add_column(
        "invoices",
        sa.Column(
            "amount_paid",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )

    # --- products ---
    op.add_column(
        "products",
        sa.Column(
            "sales_price",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "product_type",
            sa.String(32),
            nullable=False,
            server_default="goods",
        ),
    )


def downgrade() -> None:
    op.drop_column("invoices", "payment_status")
    op.drop_column("invoices", "amount_paid")
    op.drop_column("products", "sales_price")
    op.drop_column("products", "product_type")
