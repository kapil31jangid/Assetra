from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class Payment(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    order_id: Mapped[str | None] = mapped_column(ForeignKey("rental_orders.id"))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    provider: Mapped[str] = mapped_column(String(40), default="sandbox", nullable=False)
    provider_reference: Mapped[str | None] = mapped_column(String(160), unique=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(160), unique=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)

    order = relationship("RentalOrder")


class DepositTransaction(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "deposit_transactions"

    order_id: Mapped[str] = mapped_column(ForeignKey("rental_orders.id"), nullable=False)
    payment_id: Mapped[str | None] = mapped_column(ForeignKey("payments.id"))
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)


class LateFeeAssessment(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "late_fee_assessments"

    order_id: Mapped[str] = mapped_column(ForeignKey("rental_orders.id"), nullable=False)
    minutes_late: Mapped[int] = mapped_column(nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="assessed", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
