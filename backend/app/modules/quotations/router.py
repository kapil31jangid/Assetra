from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import current_claims, require_roles
from app.modules.quotations.models import Quotation, QuotationLine, QuotationTemplate

router = APIRouter()


def quote_payload(item: Quotation) -> dict:
    return {"id": item.id, "number": item.number, "customerId": item.customer_id, "templateId": item.template_id, "status": item.status, "payload": item.payload, "notes": item.notes, "createdAt": item.created_at.isoformat(), "updatedAt": item.updated_at.isoformat()}


@router.get("")
async def list_quotations(page: int = 1, pageSize: int = 20, status: list[str] | None = None, db: AsyncSession = Depends(get_db_session), claims: dict = Depends(current_claims)) -> dict:
    query = select(Quotation).options(selectinload(Quotation.lines)).order_by(Quotation.created_at.desc())
    if claims.get("role") == "customer":
        query = query.where(Quotation.customer_id == claims["sub"])
    if status:
        query = query.where(Quotation.status.in_(status))
    result = await db.scalars(query)
    return paginated_envelope([quote_payload(item) for item in result.unique().all()], page=page, page_size=pageSize)


class QuotationRequest(BaseModel):
    customerId: str | None = None
    templateId: str | None = None
    lines: list[dict] = Field(min_length=1)
    schedule: dict = {}
    notes: str | None = None


@router.post("")
async def create_quotation(request: QuotationRequest, db: AsyncSession = Depends(get_db_session), claims: dict = Depends(require_roles("admin", "vendor"))) -> dict:
    quote = Quotation(id=new_id("quo"), number=f"QT-{datetime.now(UTC).strftime('%y%m%d%H%M%S')}", customer_id=request.customerId, template_id=request.templateId, status="quotation", payload={"schedule": request.schedule}, notes=request.notes)
    quote.lines = [QuotationLine(id=new_id("qln"), quotation_id=quote.id, product_id=line["productId"], variant_id=line["variantId"], description=line.get("description", "Rental item"), quantity=int(line.get("quantity", 1)), unit_price=float(line.get("unitPrice", 0)), total=float(line.get("total", 0))) for line in request.lines]
    db.add(quote)
    await db.commit()
    await db.refresh(quote)
    return envelope(quote_payload(quote))


@router.get("/templates")
async def list_templates(db: AsyncSession = Depends(get_db_session)) -> dict:
    result = await db.scalars(select(QuotationTemplate).where(QuotationTemplate.active.is_(True)))
    return envelope([{"id": item.id, "name": item.name, "header": item.header, "footer": item.footer} for item in result.all()])
