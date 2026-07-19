from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base


class Attribute(Base):
    """
    Canonical attribute definition (e.g. 'Lens', 'Color', 'Size').
    display_type controls the UI widget: radio | pills | checkbox | image | select
    """
    __tablename__ = "attributes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    display_type: Mapped[str] = mapped_column(String(32), default="radio", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    values = relationship(
        "AttributeValue",
        back_populates="attribute",
        cascade="all, delete-orphan",
        order_by="AttributeValue.id",
    )
    product_links = relationship("ProductAttribute", back_populates="attribute", cascade="all, delete-orphan")


class AttributeValue(Base):
    """A single option within an attribute (e.g. '35mm', 'Red', 'XL')."""
    __tablename__ = "attribute_values"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    attribute_id: Mapped[str] = mapped_column(
        ForeignKey("attributes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    value: Mapped[str] = mapped_column(String(160), nullable=False)
    extra_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    attribute = relationship("Attribute", back_populates="values")


class ProductAttribute(Base):
    """
    Many-to-many junction: which attributes a product exposes.
    sort_order controls display sequence in product detail UI.
    """
    __tablename__ = "product_attributes"

    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )
    attribute_id: Mapped[str] = mapped_column(
        ForeignKey("attributes.id", ondelete="CASCADE"), primary_key=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    attribute = relationship("Attribute", back_populates="product_links")
