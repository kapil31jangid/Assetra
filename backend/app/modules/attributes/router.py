from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import require_roles
from app.modules.attributes.models import Attribute, AttributeValue

router = APIRouter()


# ---------------------------------------------------------------------------
# Serialisers
# ---------------------------------------------------------------------------

def attr_payload(attr: Attribute) -> dict:
    return {
        "id": attr.id,
        "name": attr.name,
        "displayType": attr.display_type,
        "values": [
            {
                "id": v.id,
                "value": v.value,
                "extraPrice": float(v.extra_price) if v.extra_price is not None else None,
            }
            for v in attr.values
        ],
    }


# ---------------------------------------------------------------------------
# List & Get
# ---------------------------------------------------------------------------

@router.get("")
async def list_attributes(
    page: int = 1,
    pageSize: int = 50,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    result = await db.scalars(
        select(Attribute).options(selectinload(Attribute.values)).order_by(Attribute.name)
    )
    items = [attr_payload(a) for a in result.all()]
    return paginated_envelope(items, page=page, page_size=pageSize)


@router.get("/{attribute_id}")
async def get_attribute(
    attribute_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    attr = await db.scalar(
        select(Attribute).options(selectinload(Attribute.values)).where(Attribute.id == attribute_id)
    )
    if attr is None:
        raise HTTPException(status_code=404, detail="Attribute not found.")
    return envelope(attr_payload(attr))


# ---------------------------------------------------------------------------
# Create attribute
# ---------------------------------------------------------------------------

class AttributeValueRequest(BaseModel):
    value: str = Field(min_length=1, max_length=160)
    extraPrice: float | None = Field(default=None, ge=0)


class AttributeCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    displayType: str = "radio"
    values: list[AttributeValueRequest] = []


@router.post("", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_attribute(
    request: AttributeCreateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    now = datetime.now(UTC)
    attr = Attribute(
        id=new_id("attr"),
        name=request.name,
        display_type=request.displayType,
        created_at=now,
        updated_at=now,
    )
    attr.values = [
        AttributeValue(
            id=new_id("atv"),
            attribute_id=attr.id,
            value=v.value,
            extra_price=v.extraPrice,
            created_at=now,
            updated_at=now,
        )
        for v in request.values
    ]
    db.add(attr)
    await db.commit()
    result = await db.scalar(
        select(Attribute).options(selectinload(Attribute.values)).where(Attribute.id == attr.id)
    )
    return envelope(attr_payload(result))


# ---------------------------------------------------------------------------
# Update attribute (name, display_type; replace values)
# ---------------------------------------------------------------------------

class AttributeUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    displayType: str | None = None
    values: list[AttributeValueRequest] | None = None


@router.put("/{attribute_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def update_attribute(
    attribute_id: str,
    request: AttributeUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    attr = await db.scalar(
        select(Attribute).options(selectinload(Attribute.values)).where(Attribute.id == attribute_id)
    )
    if attr is None:
        raise HTTPException(status_code=404, detail="Attribute not found.")
    now = datetime.now(UTC)
    if request.name is not None:
        attr.name = request.name
    if request.displayType is not None:
        attr.display_type = request.displayType
    attr.updated_at = now
    if request.values is not None:
        # Delete existing values and replace
        for val in attr.values:
            await db.delete(val)
        await db.flush()
        attr.values = [
            AttributeValue(
                id=new_id("atv"),
                attribute_id=attr.id,
                value=v.value,
                extra_price=v.extraPrice,
                created_at=now,
                updated_at=now,
            )
            for v in request.values
        ]
    await db.commit()
    result = await db.scalar(
        select(Attribute).options(selectinload(Attribute.values)).where(Attribute.id == attribute_id)
    )
    return envelope(attr_payload(result))


# ---------------------------------------------------------------------------
# Delete attribute
# ---------------------------------------------------------------------------

@router.delete("/{attribute_id}", dependencies=[Depends(require_roles("admin"))])
async def delete_attribute(
    attribute_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    attr = await db.get(Attribute, attribute_id)
    if attr is None:
        raise HTTPException(status_code=404, detail="Attribute not found.")
    await db.delete(attr)
    await db.commit()
    return envelope({"deleted": True, "id": attribute_id})


# ---------------------------------------------------------------------------
# Add / remove individual values (convenience endpoints)
# ---------------------------------------------------------------------------

@router.post("/{attribute_id}/values", dependencies=[Depends(require_roles("admin", "vendor"))])
async def add_attribute_value(
    attribute_id: str,
    request: AttributeValueRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    attr = await db.get(Attribute, attribute_id)
    if attr is None:
        raise HTTPException(status_code=404, detail="Attribute not found.")
    now = datetime.now(UTC)
    val = AttributeValue(
        id=new_id("atv"),
        attribute_id=attribute_id,
        value=request.value,
        extra_price=request.extraPrice,
        created_at=now,
        updated_at=now,
    )
    db.add(val)
    await db.commit()
    result = await db.scalar(
        select(Attribute).options(selectinload(Attribute.values)).where(Attribute.id == attribute_id)
    )
    return envelope(attr_payload(result))


@router.delete("/{attribute_id}/values/{value_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def delete_attribute_value(
    attribute_id: str,
    value_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    val = await db.get(AttributeValue, value_id)
    if val is None or val.attribute_id != attribute_id:
        raise HTTPException(status_code=404, detail="Attribute value not found.")
    await db.delete(val)
    await db.commit()
    return envelope({"deleted": True, "id": value_id})
