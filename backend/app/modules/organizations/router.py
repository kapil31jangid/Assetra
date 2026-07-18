from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.security import require_roles
from app.core.models import Organization

router = APIRouter()


def settings_payload(item: Organization) -> dict:
    return {"id": item.id, "companyName": item.name, "currency": item.currency, "timezone": item.timezone, "taxRate": float(item.tax_rate), "gracePeriodMinutes": item.grace_period_minutes, "lateFeeUnit": item.late_fee_unit, "lateFeeAmount": float(item.late_fee_amount), "lateFeeMaximum": float(item.late_fee_maximum) if item.late_fee_maximum is not None else None, "depositRefundDays": item.deposit_refund_window_days}


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db_session)) -> dict:
    item = await db.scalar(select(Organization).where(Organization.active.is_(True)))
    if item is None:
        raise HTTPException(status_code=404, detail="Organization settings have not been configured")
    return envelope(settings_payload(item))


class SettingsRequest(BaseModel):
    companyName: str = Field(min_length=1, max_length=180)
    currency: str = Field(min_length=3, max_length=3)
    timezone: str = Field(min_length=1, max_length=80)
    taxRate: float = Field(ge=0, le=100)
    gracePeriodMinutes: int = Field(ge=0, le=1440)
    lateFeeUnit: str = "hourly"
    lateFeeAmount: float = Field(ge=0)
    lateFeeMaximum: float | None = Field(default=None, ge=0)
    depositRefundDays: int = Field(default=3, ge=0)


@router.put("/settings", dependencies=[Depends(require_roles("admin"))])
async def update_settings(request: SettingsRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    item = await db.scalar(select(Organization).where(Organization.active.is_(True)))
    if item is None:
        raise HTTPException(status_code=404, detail="Organization settings have not been configured")
    item.name = request.companyName
    item.currency = request.currency.upper()
    item.timezone = request.timezone
    item.tax_rate = request.taxRate
    item.grace_period_minutes = request.gracePeriodMinutes
    item.late_fee_unit = request.lateFeeUnit
    item.late_fee_amount = request.lateFeeAmount
    item.late_fee_maximum = request.lateFeeMaximum
    item.deposit_refund_window_days = request.depositRefundDays
    await db.commit()
    return envelope(settings_payload(item))
