"""
User management endpoints — admin-only.

GET    /users              List all users (paginated, filterable by role/active)
GET    /users/:id          Get a single user
POST   /users              Admin creates a user with any role
PUT    /users/:id          Update name, role, active status
DELETE /users/:id          Soft-deactivate (sets active=False)
"""

import re
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.models import Organization
from app.core.security import hash_password, require_roles
from app.modules.auth.models import User

router = APIRouter()

_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,12}$")


def user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "avatarUrl": user.avatar_url,
        "active": user.active,
        "organizationId": user.organization_id,
        "createdAt": user.created_at.isoformat(),
    }


@router.get("", dependencies=[Depends(require_roles("admin"))])
async def list_users(
    page: int = 1,
    pageSize: int = 20,
    role: str | None = None,
    active: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    query = select(User).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == role)
    if active is not None:
        query = query.where(User.active.is_(active))
    result = await db.scalars(query)
    users = result.all()
    if search:
        needle = search.lower()
        users = [u for u in users if needle in u.name.lower() or needle in u.email.lower()]
    return paginated_envelope([user_payload(u) for u in users], page=page, page_size=pageSize)


@router.get("/{user_id}", dependencies=[Depends(require_roles("admin"))])
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return envelope(user_payload(user))


class AdminUserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: str = Field(min_length=3)
    password: str
    role: Literal["admin", "vendor", "customer"] = "customer"
    phone: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must be 6–12 characters with at least one uppercase, "
                "one lowercase, and one special character."
            )
        return v


@router.post("", dependencies=[Depends(require_roles("admin"))])
async def create_user(
    request: AdminUserCreateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    email = request.email.lower().strip()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    org = await db.scalar(select(Organization).where(Organization.active.is_(True)))
    user = User(
        id=f"usr_{uuid4().hex[:16]}",
        name=request.name,
        email=email,
        role=request.role,
        phone=request.phone,
        password_hash=hash_password(request.password),
        organization_id=org.id if org else None,
        active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return envelope(user_payload(user))


class AdminUserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    role: Literal["admin", "vendor", "customer"] | None = None
    phone: str | None = None
    active: bool | None = None


@router.put("/{user_id}", dependencies=[Depends(require_roles("admin"))])
async def update_user(
    user_id: str,
    request: AdminUserUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if request.name is not None:
        user.name = request.name
    if request.role is not None:
        user.role = request.role
    if request.phone is not None:
        user.phone = request.phone
    if request.active is not None:
        user.active = request.active
    await db.commit()
    return envelope(user_payload(user))


@router.delete("/{user_id}", dependencies=[Depends(require_roles("admin"))])
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    user.active = False
    await db.commit()
    return envelope({"deactivated": True, "id": user_id})
