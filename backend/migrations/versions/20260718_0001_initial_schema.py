"""Initial database schema.

Revision ID: 20260718_0001
Revises:
Create Date: 2026-07-18 00:01:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260718_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamp_columns() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def money_columns(prefix: str, nullable: bool = False) -> list[sa.Column]:
    return [
        sa.Column(f"{prefix}_amount", sa.Numeric(12, 2), nullable=nullable),
        sa.Column(f"{prefix}_currency", sa.String(length=3), nullable=nullable),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)

    op.create_table(
        "product_categories",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_categories_slug"), "product_categories", ["slug"], unique=True)

    op.create_table(
        "pricelists",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("selectable", sa.Boolean(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("category_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=220), nullable=False),
        sa.Column("slug", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("brand", sa.String(length=120), nullable=True),
        sa.Column("colors", sa.JSON(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("image_urls", sa.JSON(), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("accessories", sa.JSON(), nullable=False),
        sa.Column("deposit_required", sa.Boolean(), nullable=False),
        sa.Column("deposit_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("deposit_currency", sa.String(length=3), nullable=False),
        sa.Column("deposit_refundable", sa.Boolean(), nullable=False),
        sa.Column("deposit_refund_window_days", sa.Integer(), nullable=True),
        sa.Column("repair_status", sa.String(length=32), nullable=False),
        sa.Column("availability_status", sa.String(length=32), nullable=False),
        sa.Column("rental_units", sa.JSON(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["category_id"], ["product_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_brand"), "products", ["brand"], unique=False)
    op.create_index(op.f("ix_products_slug"), "products", ["slug"], unique=True)

    op.create_table(
        "product_variants",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("product_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("sku", sa.String(length=120), nullable=False),
        sa.Column("attribute_value_ids", sa.JSON(), nullable=False),
        sa.Column("repair_status", sa.String(length=32), nullable=False),
        sa.Column("stock_total", sa.Integer(), nullable=False),
        sa.Column("stock_available", sa.Integer(), nullable=False),
        sa.Column("stock_reserved", sa.Integer(), nullable=False),
        sa.Column("stock_in_use", sa.Integer(), nullable=False),
        sa.Column("stock_under_repair", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_variants_sku"), "product_variants", ["sku"], unique=True)

    op.create_table(
        "pricing_rules",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("pricelist_id", sa.String(length=64), nullable=False),
        sa.Column("product_id", sa.String(length=64), nullable=True),
        sa.Column("variant_id", sa.String(length=64), nullable=True),
        sa.Column("period_unit", sa.String(length=32), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("fixed_price_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("fixed_price_currency", sa.String(length=3), nullable=True),
        sa.Column("discount_percent", sa.Numeric(5, 2), nullable=True),
        sa.Column("minimum_quantity", sa.Integer(), nullable=False),
        sa.Column("valid_from", sa.Date(), nullable=True),
        sa.Column("valid_to", sa.Date(), nullable=True),
        sa.Column("selectable", sa.Boolean(), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["pricelist_id"], ["pricelists.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "rental_orders",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("number", sa.String(length=80), nullable=False),
        sa.Column("customer_user_id", sa.String(length=64), nullable=True),
        sa.Column("customer_snapshot", sa.JSON(), nullable=False),
        sa.Column("vendor_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("schedule", sa.JSON(), nullable=False),
        sa.Column("price", sa.JSON(), nullable=False),
        sa.Column("deposit", sa.JSON(), nullable=False),
        sa.Column("deposit_transactions", sa.JSON(), nullable=False),
        sa.Column("late_fees", sa.JSON(), nullable=False),
        sa.Column("damage_reports", sa.JSON(), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["customer_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rental_orders_number"), "rental_orders", ["number"], unique=True)
    op.create_index(op.f("ix_rental_orders_status"), "rental_orders", ["status"], unique=False)
    op.create_index(op.f("ix_rental_orders_vendor_id"), "rental_orders", ["vendor_id"], unique=False)

    op.create_table(
        "rental_order_lines",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("product_id", sa.String(length=64), nullable=False),
        sa.Column("variant_id", sa.String(length=64), nullable=False),
        sa.Column("product_name", sa.String(length=220), nullable=False),
        sa.Column("variant_name", sa.String(length=160), nullable=False),
        sa.Column("sku", sa.String(length=120), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("rental_starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rental_ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rental_unit", sa.String(length=32), nullable=False),
        sa.Column("rental_quantity", sa.Integer(), nullable=False),
        sa.Column("rental_timezone", sa.String(length=80), nullable=False),
        *money_columns("unit_price"),
        *money_columns("line_total"),
        sa.Column("accessories_snapshot", sa.JSON(), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["order_id"], ["rental_orders.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "fulfillment_events",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recorded_by_snapshot", sa.JSON(), nullable=False),
        sa.Column("checklist", sa.JSON(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("photos", sa.JSON(), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["order_id"], ["rental_orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "invoices",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("number", sa.String(length=80), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=True),
        sa.Column("customer_snapshot", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        *money_columns("subtotal"),
        *money_columns("tax"),
        *money_columns("total"),
        sa.Column("due_at", sa.Date(), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["order_id"], ["rental_orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_invoices_number"), "invoices", ["number"], unique=True)
    op.create_index(op.f("ix_invoices_status"), "invoices", ["status"], unique=False)

    op.create_table(
        "invoice_lines",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("invoice_id", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        *money_columns("unit_price"),
        *money_columns("total"),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("invoice_lines")
    op.drop_index(op.f("ix_invoices_status"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_number"), table_name="invoices")
    op.drop_table("invoices")
    op.drop_table("fulfillment_events")
    op.drop_table("rental_order_lines")
    op.drop_index(op.f("ix_rental_orders_vendor_id"), table_name="rental_orders")
    op.drop_index(op.f("ix_rental_orders_status"), table_name="rental_orders")
    op.drop_index(op.f("ix_rental_orders_number"), table_name="rental_orders")
    op.drop_table("rental_orders")
    op.drop_table("pricing_rules")
    op.drop_index(op.f("ix_product_variants_sku"), table_name="product_variants")
    op.drop_table("product_variants")
    op.drop_index(op.f("ix_products_slug"), table_name="products")
    op.drop_index(op.f("ix_products_brand"), table_name="products")
    op.drop_table("products")
    op.drop_table("pricelists")
    op.drop_index(op.f("ix_product_categories_slug"), table_name="product_categories")
    op.drop_table("product_categories")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
