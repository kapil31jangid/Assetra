from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class RentalOrder(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "rental_orders"

    number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    customer_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    customer_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    vendor_id: Mapped[str | None] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    schedule: Mapped[dict] = mapped_column(JSON, nullable=False)
    price: Mapped[dict] = mapped_column(JSON, nullable=False)
    deposit: Mapped[dict] = mapped_column(JSON, nullable=False)
    deposit_transactions: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    late_fees: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    damage_reports: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)

    customer_user = relationship("User", back_populates="rental_orders")
    lines = relationship("RentalOrderLine", back_populates="order", cascade="all, delete-orphan")
    fulfillment_events = relationship(
        "FulfillmentEvent",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    invoices = relationship("Invoice", back_populates="order")


class RentalOrderLine(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "rental_order_lines"

    order_id: Mapped[str] = mapped_column(ForeignKey("rental_orders.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    variant_id: Mapped[str] = mapped_column(ForeignKey("product_variants.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(220), nullable=False)
    variant_name: Mapped[str] = mapped_column(String(160), nullable=False)
    sku: Mapped[str] = mapped_column(String(120), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rental_starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rental_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rental_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    rental_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rental_timezone: Mapped[str] = mapped_column(String(80), nullable=False)
    unit_price_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    line_total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    accessories_snapshot: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)

    order = relationship("RentalOrder", back_populates="lines")
    product = relationship("Product", back_populates="order_lines")
    variant = relationship("ProductVariant", back_populates="order_lines")
