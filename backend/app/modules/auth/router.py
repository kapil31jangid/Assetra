import re
from datetime import datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.models import Organization
from app.core.security import create_access_token, current_claims, hash_password, verify_password
from app.modules.auth.models import Address, User

router = APIRouter()

# Password complexity: 6-12 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special character
_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,12}$")


def _validate_password(value: str) -> str:
    if not _PASSWORD_RE.match(value):
        raise ValueError(
            "Password must be 6–12 characters and contain at least one uppercase letter, "
            "one lowercase letter, and one special character."
        )
    return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: str = Field(min_length=3)
    password: str
    role: Literal["admin", "vendor", "customer"] = "customer"
    companyName: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password(v)


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

    @field_validator("newPassword")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password(v)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3)


class ProfileRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=32)


class AddressRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    line1: str = Field(min_length=1, max_length=240)
    line2: str | None = Field(default=None, max_length=240)
    city: str = Field(min_length=1, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postalCode: str = Field(min_length=1, max_length=32)
    countryCode: str = Field(default="IN", min_length=2, max_length=2)
    phone: str | None = Field(default=None, max_length=32)
    isDefault: bool = False


def session_payload(user: User, expires_at: datetime, token: str) -> dict:
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatarUrl": user.avatar_url,
        },
        "expiresAt": expires_at.isoformat(),
        "accessToken": token,
    }


def address_payload(address: Address) -> dict:
    return {
        "id": address.id,
        "name": address.name,
        "line1": address.line1,
        "line2": address.line2,
        "city": address.city,
        "state": address.state,
        "postalCode": address.postal_code,
        "countryCode": address.country_code,
        "phone": address.phone,
        "isDefault": address.is_default,
    }


@router.get("")
async def current_session(
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    result = await db.execute(select(User).where(User.id == claims["sub"], User.active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Session user is no longer active")
    token, expires = create_access_token(user.id, user.role)
    return envelope(session_payload(user, expires, token))


@router.post("/login")
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    result = await db.execute(
        select(User).where(User.email == request.email.lower(), User.active.is_(True))
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token, expires = create_access_token(user.id, user.role)
    return envelope(session_payload(user, expires, token))


@router.post("/signup")
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    email = request.email.lower().strip()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    organization = await db.scalar(select(Organization).where(Organization.active.is_(True)))
    if organization is None:
        organization = Organization(
            id="org_default",
            name=request.companyName or "Assetra Rental Company",
            currency="INR",
            timezone="Asia/Kolkata",
            tax_rate=18,
            grace_period_minutes=0,
            late_fee_unit="hourly",
            late_fee_amount=250,
            late_fee_maximum=None,
            deposit_refund_window_days=3,
        )
        db.add(organization)
        await db.flush()
    user = User(
        id=f"usr_{uuid4().hex[:16]}",
        name=request.name,
        email=email,
        role=request.role,
        password_hash=hash_password(request.password),
        organization_id=organization.id,
        active=True,
    )
    db.add(user)
    await db.commit()
    token, expires = create_access_token(user.id, user.role)
    return envelope(session_payload(user, expires, token))


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest) -> dict:
    # TODO: Attach real email delivery (SMTP/SendGrid) here for production.
    return envelope(
        {"message": f"If {request.email} is registered, password reset instructions were sent."}
    )


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie("assetra_session")
    return envelope(None)


@router.get("/me")
async def profile(
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user = await db.get(User, claims["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="User profile was not found")
    return envelope({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "avatarUrl": user.avatar_url,
        "role": user.role,
    })


@router.put("/me")
async def update_profile(
    request: ProfileRequest,
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user = await db.get(User, claims["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="User profile was not found")
    user.name = request.name
    user.phone = request.phone
    await db.commit()
    return envelope({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "avatarUrl": user.avatar_url,
        "role": user.role,
    })


@router.put("/me/password")
async def change_password(
    request: ChangePasswordRequest,
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user = await db.get(User, claims["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(request.currentPassword, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    user.password_hash = hash_password(request.newPassword)
    await db.commit()
    return envelope({"message": "Password updated successfully"})


# ---------------------------------------------------------------------------
# Address book (customer-owned, scoped to caller)
# ---------------------------------------------------------------------------

@router.get("/me/addresses")
async def list_addresses(
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    result = await db.scalars(select(Address).where(Address.user_id == claims["sub"]))
    return envelope([address_payload(a) for a in result.all()])


@router.post("/me/addresses")
async def create_address(
    request: AddressRequest,
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    if request.isDefault:
        # Unset all existing defaults first
        existing = await db.scalars(
            select(Address).where(Address.user_id == claims["sub"], Address.is_default.is_(True))
        )
        for addr in existing.all():
            addr.is_default = False
    address = Address(
        id=f"addr_{uuid4().hex[:16]}",
        user_id=claims["sub"],
        name=request.name,
        line1=request.line1,
        line2=request.line2,
        city=request.city,
        state=request.state,
        postal_code=request.postalCode,
        country_code=request.countryCode,
        phone=request.phone,
        is_default=request.isDefault,
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return envelope(address_payload(address))


@router.put("/me/addresses/{address_id}")
async def update_address(
    address_id: str,
    request: AddressRequest,
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != claims["sub"]:
        raise HTTPException(status_code=404, detail="Address not found")
    if request.isDefault and not address.is_default:
        existing = await db.scalars(
            select(Address).where(Address.user_id == claims["sub"], Address.is_default.is_(True))
        )
        for addr in existing.all():
            addr.is_default = False
    address.name = request.name
    address.line1 = request.line1
    address.line2 = request.line2
    address.city = request.city
    address.state = request.state
    address.postal_code = request.postalCode
    address.country_code = request.countryCode
    address.phone = request.phone
    address.is_default = request.isDefault
    await db.commit()
    return envelope(address_payload(address))


@router.delete("/me/addresses/{address_id}")
async def delete_address(
    address_id: str,
    claims: dict = Depends(current_claims),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != claims["sub"]:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(address)
    await db.commit()
    return envelope({"deleted": True, "id": address_id})
