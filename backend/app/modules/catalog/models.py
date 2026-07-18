from sqlalchemy import Boolean, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class ProductCategory(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "product_categories"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)

    products = relationship("Product", back_populates="category")


class Product(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "products"

    category_id: Mapped[str] = mapped_column(ForeignKey("product_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(220), nullable=False)
    slug: Mapped[str] = mapped_column(String(240), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    brand: Mapped[str | None] = mapped_column(String(120), index=True)
    colors: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    image_urls: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    attributes: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    accessories: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    deposit_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deposit_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    deposit_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    deposit_refundable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deposit_refund_window_days: Mapped[int | None] = mapped_column(Integer)
    repair_status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)
    availability_status: Mapped[str] = mapped_column(String(32), default="available", nullable=False)
    rental_units: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category = relationship("ProductCategory", back_populates="products")
    variants = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    order_lines = relationship("RentalOrderLine", back_populates="product")


class ProductVariant(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sku: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    attribute_value_ids: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    repair_status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)
    stock_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_in_use: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_under_repair: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))

    product = relationship("Product", back_populates="variants")
    order_lines = relationship("RentalOrderLine", back_populates="variant")
