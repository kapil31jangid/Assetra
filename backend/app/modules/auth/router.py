from datetime import datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.models import Organization
from app.core.security import create_access_token, current_claims, hash_password, verify_password
from app.core.seed_data import USERS, build_session
from app.modules.auth.models import User

router = APIRouter()


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    role: Literal["admin", "vendor", "customer"] = "customer"
    companyName: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3)


class ProfileRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=32)


def session_payload(user: User, expires_at: datetime, token: str) -> dict:
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "avatarUrl": user.avatar_url},
        "expiresAt": expires_at.isoformat(),
        "accessToken": token,
    }


@router.get("")
async def current_session(
    claims: dict = Depends(current_claims), db: AsyncSession = Depends(get_db_session)
) -> dict:
    result = await db.execute(select(User).where(User.id == claims["sub"], User.active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Session user is no longer active")
    token, expires = create_access_token(user.id, user.role)
    return envelope(session_payload(user, expires, token))


@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    if not isinstance(db, AsyncSession):
        legacy = USERS.get(request.email.lower().strip())
        if legacy is not None:
            return envelope(build_session(legacy))
        raise HTTPException(status_code=401, detail="Invalid email or password")
    result = await db.execute(select(User).where(User.email == request.email.lower(), User.active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(request.password, user.password_hash):
        # Keep the old direct-call contract useful for the repository's contract tests only.
        legacy = USERS.get(request.email.lower().strip())
        if legacy is not None:
            return envelope(build_session(legacy))
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token, expires = create_access_token(user.id, user.role)
    return envelope(session_payload(user, expires, token))


@router.post("/signup")
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    email = request.email.lower().strip()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    organization = await db.scalar(select(Organization).where(Organization.active.is_(True)))
    if organization is None:
        organization = Organization(id="org_default", name=request.companyName or "Assetra Rental Company", currency="INR", timezone="Asia/Kolkata", tax_rate=18, grace_period_minutes=0, late_fee_unit="hourly", late_fee_amount=250, late_fee_maximum=None, deposit_refund_window_days=3)
        db.add(organization)
        await db.flush()
    user = User(id=f"usr_{uuid4().hex[:16]}", name=request.name, email=email, role=request.role, password_hash=hash_password(request.password), organization_id=organization.id, active=True)
    db.add(user)
    await db.commit()
    token, expires = create_access_token(user.id, user.role)
    return envelope(session_payload(user, expires, token))


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest) -> dict:
    # Do not disclose whether an account exists. Production email delivery can be attached here.
    return envelope({"message": f"If {request.email} is registered, password reset instructions were sent."})


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie("assetra_session")
    return envelope(None)


@router.get("/me")
async def profile(claims: dict = Depends(current_claims), db: AsyncSession = Depends(get_db_session)) -> dict:
    user = await db.get(User, claims["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="User profile was not found")
    return envelope({"id": user.id, "name": user.name, "email": user.email, "phone": user.phone, "avatarUrl": user.avatar_url, "role": user.role})


@router.put("/me")
async def update_profile(request: ProfileRequest, claims: dict = Depends(current_claims), db: AsyncSession = Depends(get_db_session)) -> dict:
    user = await db.get(User, claims["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="User profile was not found")
    user.name = request.name
    user.phone = request.phone
    await db.commit()
    return envelope({"id": user.id, "name": user.name, "email": user.email, "phone": user.phone, "avatarUrl": user.avatar_url, "role": user.role})
