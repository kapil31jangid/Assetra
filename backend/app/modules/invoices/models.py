from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class Invoice(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "invoices"

    number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("rental_orders.id"))
    customer_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    # Lifecycle: draft → posted
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    # Payment tracking: unpaid | partially_paid | paid
    payment_status: Mapped[str] = mapped_column(String(32), default="unpaid", nullable=False)
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    subtotal_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    tax_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    due_at: Mapped[date | None] = mapped_column(Date)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order = relationship("RentalOrder", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLine(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "invoice_lines"

    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    invoice = relationship("Invoice", back_populates="lines")
