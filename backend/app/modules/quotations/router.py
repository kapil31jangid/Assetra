from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
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


# ---------------------------------------------------------------------------
# Serialisers
# ---------------------------------------------------------------------------

def template_payload(t: QuotationTemplate) -> dict:
    return {"id": t.id, "name": t.name, "header": t.header, "footer": t.footer, "active": t.active}


def quote_payload(item: Quotation) -> dict:
    return {
        "id": item.id,
        "number": item.number,
        "customerId": item.customer_id,
        "templateId": item.template_id,
        "status": item.status,
        "payload": item.payload,
        "notes": item.notes,
        "lines": [
            {
                "id": ln.id,
                "productId": ln.product_id,
                "variantId": ln.variant_id,
                "description": ln.description,
                "quantity": ln.quantity,
                "unitPrice": ln.unit_price,
                "total": ln.total,
            }
            for ln in item.lines
        ],
        "createdAt": item.created_at.isoformat(),
        "updatedAt": item.updated_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# Quotation Templates (admin/vendor)
# ---------------------------------------------------------------------------

class TemplateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    header: str | None = None
    footer: str | None = None


@router.get("/templates")
async def list_templates(
    includeInactive: bool = False,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    query = select(QuotationTemplate)
    if not includeInactive:
        query = query.where(QuotationTemplate.active.is_(True))
    result = await db.scalars(query.order_by(QuotationTemplate.created_at.desc()))
    return envelope([template_payload(t) for t in result.all()])


@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    t = await db.get(QuotationTemplate, template_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Template not found.")
    return envelope(template_payload(t))


@router.post("/templates", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_template(
    request: TemplateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    t = QuotationTemplate(id=new_id("qtpl"), name=request.name, header=request.header, footer=request.footer, active=True)
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return envelope(template_payload(t))


@router.put("/templates/{template_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def update_template(
    template_id: str,
    request: TemplateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    t = await db.get(QuotationTemplate, template_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Template not found.")
    t.name = request.name
    t.header = request.header
    t.footer = request.footer
    await db.commit()
    return envelope(template_payload(t))


@router.delete("/templates/{template_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    t = await db.get(QuotationTemplate, template_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Template not found.")
    t.active = False   # soft-delete: preserve historical reference
    await db.commit()
    return envelope({"deleted": True, "id": template_id})


# ---------------------------------------------------------------------------
# Quotations
# ---------------------------------------------------------------------------

@router.get("")
async def list_quotations(
    page: int = 1,
    pageSize: int = 20,
    status: list[str] | None = None,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    query = select(Quotation).options(selectinload(Quotation.lines)).order_by(Quotation.created_at.desc())
    if claims.get("role") == "customer":
        query = query.where(Quotation.customer_id == claims["sub"])
    if status:
        query = query.where(Quotation.status.in_(status))
    result = await db.scalars(query)
    return paginated_envelope(
        [quote_payload(item) for item in result.unique().all()],
        page=page,
        page_size=pageSize,
    )


@router.get("/{quotation_id}")
async def get_quotation(
    quotation_id: str,
    db: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(current_claims),
) -> dict:
    quote = await db.scalar(
        select(Quotation).options(selectinload(Quotation.lines)).where(Quotation.id == quotation_id)
    )
    if quote is None or (claims.get("role") == "customer" and quote.customer_id != claims["sub"]):
        raise HTTPException(status_code=404, detail="Quotation not found.")
    return envelope(quote_payload(quote))


class QuotationRequest(BaseModel):
    customerId: str | None = None
    templateId: str | None = None
    lines: list[dict] = Field(min_length=1)
    schedule: dict = {}
    notes: str | None = None


@router.post("", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_quotation(
    request: QuotationRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    quote = Quotation(
        id=new_id("quo"),
        number=f"QT-{datetime.now(UTC).strftime('%y%m%d%H%M%S')}",
        customer_id=request.customerId,
        template_id=request.templateId,
        status="quotation",
        payload={"schedule": request.schedule},
        notes=request.notes,
    )
    quote.lines = [
        QuotationLine(
            id=new_id("qln"),
            quotation_id=quote.id,
            product_id=line["productId"],
            variant_id=line["variantId"],
            description=line.get("description", "Rental item"),
            quantity=int(line.get("quantity", 1)),
            unit_price=float(line.get("unitPrice", 0)),
            total=float(line.get("total", 0)),
        )
        for line in request.lines
    ]
    db.add(quote)
    await db.commit()
    result = await db.scalar(
        select(Quotation).options(selectinload(Quotation.lines)).where(Quotation.id == quote.id)
    )
    return envelope(quote_payload(result))


class QuotationStatusRequest(BaseModel):
    status: str  # quotation | quotation_sent | confirmed | cancelled


@router.post("/{quotation_id}/status", dependencies=[Depends(require_roles("admin", "vendor"))])
async def update_quotation_status(
    quotation_id: str,
    request: QuotationStatusRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    allowed_transitions = {
        "quotation": {"quotation_sent", "confirmed", "cancelled"},
        "quotation_sent": {"confirmed", "cancelled"},
        "confirmed": {"cancelled"},
        "cancelled": set(),
    }
    quote = await db.scalar(
        select(Quotation).options(selectinload(Quotation.lines)).where(Quotation.id == quotation_id)
    )
    if quote is None:
        raise HTTPException(status_code=404, detail="Quotation not found.")
    if request.status not in allowed_transitions.get(quote.status, set()):
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition quotation from '{quote.status}' to '{request.status}'.",
        )
    quote.status = request.status
    await db.commit()
    return envelope(quote_payload(quote))
