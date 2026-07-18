"""Persistent operational support tables."""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260718_0002"
down_revision: str | Sequence[str] | None = "20260718_0001"
branch_labels = None
depends_on = None


def ts():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("organizations", sa.Column("id", sa.String(64), primary_key=True), sa.Column("name", sa.String(180), nullable=False), sa.Column("currency", sa.String(3), nullable=False), sa.Column("timezone", sa.String(80), nullable=False), sa.Column("tax_rate", sa.Numeric(5, 2), nullable=False), sa.Column("grace_period_minutes", sa.Integer, nullable=False), sa.Column("late_fee_unit", sa.String(16), nullable=False), sa.Column("late_fee_amount", sa.Numeric(12, 2), nullable=False), sa.Column("late_fee_maximum", sa.Numeric(12, 2)), sa.Column("deposit_refund_window_days", sa.Integer, nullable=False), sa.Column("active", sa.Boolean, nullable=False), *ts())
    op.add_column("users", sa.Column("organization_id", sa.String(64), sa.ForeignKey("organizations.id")))
    op.create_table("user_sessions", sa.Column("id", sa.String(64), primary_key=True), sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id"), nullable=False), sa.Column("token_hash", sa.String(128), unique=True, nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked", sa.Boolean, nullable=False), *ts())
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_table("addresses", sa.Column("id", sa.String(64), primary_key=True), sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id"), nullable=False), sa.Column("name", sa.String(160), nullable=False), sa.Column("line1", sa.String(240), nullable=False), sa.Column("line2", sa.String(240)), sa.Column("city", sa.String(100), nullable=False), sa.Column("state", sa.String(100)), sa.Column("postal_code", sa.String(32), nullable=False), sa.Column("country_code", sa.String(2), nullable=False), sa.Column("phone", sa.String(32)), sa.Column("is_default", sa.Boolean, nullable=False), *ts())
    op.create_index("ix_addresses_user_id", "addresses", ["user_id"])
    op.create_table("payments", sa.Column("id", sa.String(64), primary_key=True), sa.Column("order_id", sa.String(64), sa.ForeignKey("rental_orders.id")), sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id")), sa.Column("provider", sa.String(40), nullable=False), sa.Column("provider_reference", sa.String(160), unique=True), sa.Column("kind", sa.String(32), nullable=False), sa.Column("status", sa.String(32), nullable=False), sa.Column("amount", sa.Numeric(12,2), nullable=False), sa.Column("currency", sa.String(3), nullable=False), sa.Column("idempotency_key", sa.String(160), unique=True), sa.Column("processed_at", sa.DateTime(timezone=True)), sa.Column("failure_reason", sa.Text), *ts())
    op.create_index("ix_payments_status", "payments", ["status"])
    op.create_table("deposit_transactions", sa.Column("id", sa.String(64), primary_key=True), sa.Column("order_id", sa.String(64), sa.ForeignKey("rental_orders.id"), nullable=False), sa.Column("payment_id", sa.String(64), sa.ForeignKey("payments.id")), sa.Column("type", sa.String(32), nullable=False), sa.Column("amount", sa.Numeric(12,2), nullable=False), sa.Column("currency", sa.String(3), nullable=False), sa.Column("note", sa.Text), *ts())
    op.create_table("late_fee_assessments", sa.Column("id", sa.String(64), primary_key=True), sa.Column("order_id", sa.String(64), sa.ForeignKey("rental_orders.id"), nullable=False), sa.Column("minutes_late", sa.Integer, nullable=False), sa.Column("amount", sa.Numeric(12,2), nullable=False), sa.Column("currency", sa.String(3), nullable=False), sa.Column("status", sa.String(32), nullable=False), sa.Column("note", sa.Text), *ts())
    op.create_table("quotation_templates", sa.Column("id", sa.String(64), primary_key=True), sa.Column("name", sa.String(160), nullable=False), sa.Column("header", sa.Text), sa.Column("footer", sa.Text), sa.Column("active", sa.Boolean, nullable=False), *ts())
    op.create_table("quotations", sa.Column("id", sa.String(64), primary_key=True), sa.Column("number", sa.String(80), unique=True, nullable=False), sa.Column("customer_id", sa.String(64), sa.ForeignKey("users.id")), sa.Column("template_id", sa.String(64), sa.ForeignKey("quotation_templates.id")), sa.Column("status", sa.String(32), nullable=False), sa.Column("payload", sa.JSON, nullable=False), sa.Column("notes", sa.Text), *ts())
    op.create_table("quotation_lines", sa.Column("id", sa.String(64), primary_key=True), sa.Column("quotation_id", sa.String(64), sa.ForeignKey("quotations.id"), nullable=False), sa.Column("product_id", sa.String(64), sa.ForeignKey("products.id"), nullable=False), sa.Column("variant_id", sa.String(64), sa.ForeignKey("product_variants.id"), nullable=False), sa.Column("description", sa.String(240), nullable=False), sa.Column("quantity", sa.Integer, nullable=False), sa.Column("unit_price", sa.Numeric(12,2), nullable=False), sa.Column("total", sa.Numeric(12,2), nullable=False), *ts())


def downgrade() -> None:
    op.drop_column("users", "organization_id")
    for table in ("quotation_lines", "quotations", "quotation_templates", "late_fee_assessments", "deposit_transactions", "payments", "addresses", "user_sessions", "organizations"):
        op.drop_table(table)
