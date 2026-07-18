from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class QuotationTemplate(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "quotation_templates"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    header: Mapped[str | None] = mapped_column(Text)
    footer: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)


class Quotation(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "quotations"

    number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    template_id: Mapped[str | None] = mapped_column(ForeignKey("quotation_templates.id"))
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    lines = relationship("QuotationLine", cascade="all, delete-orphan")


class QuotationLine(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "quotation_lines"

    quotation_id: Mapped[str] = mapped_column(ForeignKey("quotations.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    variant_id: Mapped[str] = mapped_column(ForeignKey("product_variants.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[float] = mapped_column(nullable=False)
    total: Mapped[float] = mapped_column(nullable=False)
