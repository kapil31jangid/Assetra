from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, StringIdMixin, TimestampMixin


class FulfillmentEvent(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "fulfillment_events"

    order_id: Mapped[str] = mapped_column(ForeignKey("rental_orders.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    recorded_by_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    checklist: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    photos: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    order = relationship("RentalOrder", back_populates="fulfillment_events")
