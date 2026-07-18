from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class Pricelist(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "pricelists"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    selectable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    rules = relationship("PricingRule", back_populates="pricelist", cascade="all, delete-orphan")


class PricingRule(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "pricing_rules"

    pricelist_id: Mapped[str] = mapped_column(ForeignKey("pricelists.id"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id"))
    variant_id: Mapped[str | None] = mapped_column(ForeignKey("product_variants.id"))
    period_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    fixed_price_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    fixed_price_currency: Mapped[str | None] = mapped_column(String(3))
    discount_percent: Mapped[float | None] = mapped_column(Numeric(5, 2))
    minimum_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_to: Mapped[date | None] = mapped_column(Date)
    selectable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    pricelist = relationship("Pricelist", back_populates="rules")
