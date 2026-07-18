from datetime import UTC, datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all persistence models."""


class StringIdMixin:
    id: Mapped[str] = mapped_column(String(64), primary_key=True)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )


class Organization(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(180), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    timezone: Mapped[str] = mapped_column(String(80), default="Asia/Kolkata", nullable=False)
    tax_rate: Mapped[float] = mapped_column(default=18, nullable=False)
    grace_period_minutes: Mapped[int] = mapped_column(default=0, nullable=False)
    late_fee_unit: Mapped[str] = mapped_column(String(16), default="hourly", nullable=False)
    late_fee_amount: Mapped[float] = mapped_column(default=0, nullable=False)
    late_fee_maximum: Mapped[float | None] = mapped_column(nullable=True)
    deposit_refund_window_days: Mapped[int] = mapped_column(default=3, nullable=False)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)
