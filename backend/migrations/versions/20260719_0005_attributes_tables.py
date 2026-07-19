"""
Tier 2a — Attributes tables + data backfill from existing Product.attributes JSON blobs.

Creates three new tables:
  - attributes          (canonical attribute definitions)
  - attribute_values    (per-attribute option values)
  - product_attributes  (many-to-many junction: product ↔ attribute)

Data backfill reads the existing JSON-blob array from Product.attributes and populates
the new tables idempotently using INSERT … ON CONFLICT DO NOTHING, so it is safe to
re-run. After backfill the Product.attributes column is NOT dropped (it continues to
serve as a read cache for the catalog API) — clearing it can be done in a follow-up
migration once the CRUD endpoints are fully adopted.
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision: str = "20260719_0005"
down_revision: str | Sequence[str] | None = "20260719_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Create attributes table ──
    op.create_table(
        "attributes",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("display_type", sa.String(32), nullable=False, server_default="radio"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── Create attribute_values table ──
    op.create_table(
        "attribute_values",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("attribute_id", sa.String(64), sa.ForeignKey("attributes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("value", sa.String(160), nullable=False),
        sa.Column("extra_price", sa.Numeric(12, 2)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_attribute_values_attribute_id", "attribute_values", ["attribute_id"])

    # ── Create product_attributes junction table ──
    op.create_table(
        "product_attributes",
        sa.Column("product_id", sa.String(64), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attribute_id", sa.String(64), sa.ForeignKey("attributes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("product_id", "attribute_id"),
    )

    # ── Data backfill: read existing JSON blobs ──
    conn = op.get_bind()

    # Fetch all products that have non-empty attribute blobs
    rows = conn.execute(
        text("SELECT id, attributes FROM products WHERE attributes IS NOT NULL AND attributes::text != '[]'")
    ).fetchall()

    for product_id, attrs_json in rows:
        if not attrs_json:
            continue
        attrs = attrs_json if isinstance(attrs_json, list) else []
        for attr_blob in attrs:
            attr_id = str(attr_blob.get("id", "")).strip()
            attr_name = str(attr_blob.get("name", "")).strip()
            display_type = str(attr_blob.get("displayType", "radio")).strip()
            if not attr_id or not attr_name:
                continue

            # Insert attribute (idempotent)
            conn.execute(
                text(
                    "INSERT INTO attributes (id, name, display_type) "
                    "VALUES (:id, :name, :display_type) "
                    "ON CONFLICT (id) DO NOTHING"
                ),
                {"id": attr_id, "name": attr_name, "display_type": display_type},
            )

            # Insert attribute values
            for val_blob in attr_blob.get("values", []):
                val_id = str(val_blob.get("id", "")).strip()
                val_label = str(val_blob.get("label", "")).strip()
                if not val_id or not val_label:
                    continue
                conn.execute(
                    text(
                        "INSERT INTO attribute_values (id, attribute_id, value) "
                        "VALUES (:id, :attribute_id, :value) "
                        "ON CONFLICT (id) DO NOTHING"
                    ),
                    {"id": val_id, "attribute_id": attr_id, "value": val_label},
                )

            # Link product → attribute
            conn.execute(
                text(
                    "INSERT INTO product_attributes (product_id, attribute_id) "
                    "VALUES (:product_id, :attribute_id) "
                    "ON CONFLICT DO NOTHING"
                ),
                {"product_id": product_id, "attribute_id": attr_id},
            )


def downgrade() -> None:
    op.drop_table("product_attributes")
    op.drop_index("ix_attribute_values_attribute_id", table_name="attribute_values")
    op.drop_table("attribute_values")
    op.drop_table("attributes")
