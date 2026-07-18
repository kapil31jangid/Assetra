from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import require_roles
from app.core.seed_data import PRICELISTS, clone_list
from app.modules.pricing.models import PricingRule, Pricelist

router = APIRouter()


def pricing_payload(pricelist: Pricelist) -> dict:
    return {"id": pricelist.id, "name": pricelist.name, "currency": pricelist.currency, "selectable": pricelist.selectable, "active": pricelist.active, "rules": [{"id": r.id, "periodUnit": r.period_unit, "kind": r.kind, "fixedPrice": {"amount": float(r.fixed_price_amount), "currency": r.fixed_price_currency or pricelist.currency} if r.fixed_price_amount is not None else None, "discountPercent": float(r.discount_percent) if r.discount_percent is not None else None, "minimumQuantity": r.minimum_quantity, "validFrom": r.valid_from.isoformat() if r.valid_from else None, "validTo": r.valid_to.isoformat() if r.valid_to else None, "selectable": r.selectable} for r in pricelist.rules]}


@router.get("")
async def list_pricelists(db: AsyncSession = Depends(get_db_session)) -> dict:
    if not isinstance(db, AsyncSession):
        return envelope(clone_list(PRICELISTS))
    result = await db.scalars(select(Pricelist).options(selectinload(Pricelist.rules)).where(Pricelist.active.is_(True)))
    return envelope([pricing_payload(item) for item in result.all()])


class PricingRuleRequest(BaseModel):
    periodUnit: str
    kind: str = "fixed_price"
    productId: str | None = None
    variantId: str | None = None
    fixedPriceAmount: float | None = Field(default=None, ge=0)
    discountPercent: float | None = Field(default=None, ge=0, le=100)
    minimumQuantity: int = Field(default=1, gt=0)
    validFrom: date | None = None
    validTo: date | None = None


class PricelistRequest(BaseModel):
    name: str = Field(min_length=1)
    currency: str = "INR"
    selectable: bool = True
    rules: list[PricingRuleRequest] = []


@router.post("", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_pricelist(request: PricelistRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    pricelist = Pricelist(id=new_id("price"), name=request.name, currency=request.currency, selectable=request.selectable, active=True)
    pricelist.rules = [PricingRule(id=new_id("rule"), period_unit=rule.periodUnit, kind=rule.kind, product_id=rule.productId, variant_id=rule.variantId, fixed_price_amount=rule.fixedPriceAmount, fixed_price_currency=request.currency, discount_percent=rule.discountPercent, minimum_quantity=rule.minimumQuantity, valid_from=rule.validFrom, valid_to=rule.validTo, selectable=True) for rule in request.rules]
    db.add(pricelist)
    await db.commit()
    await db.refresh(pricelist)
    return envelope(pricing_payload(pricelist))
