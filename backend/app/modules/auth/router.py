from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.responses import envelope
from app.core.seed_data import USERS, build_session, new_id


router = APIRouter()


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class SignupRequest(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    role: Literal["admin", "vendor", "customer"]
    companyName: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3)


@router.get("")
async def current_session() -> dict:
    return envelope(build_session(USERS["admin@assetra.local"]))


@router.post("/login")
async def login(request: LoginRequest) -> dict:
    user = USERS.get(request.email.lower().strip())
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Use admin@assetra.local, vendor@assetra.local, or nisha@example.com.",
        )

    return envelope(build_session(user))


@router.post("/signup")
async def signup(request: SignupRequest) -> dict:
    email = request.email.lower().strip()
    user = {
        "id": new_id("usr"),
        "name": request.name,
        "email": email,
        "role": request.role,
    }
    USERS[email] = user
    return envelope(build_session(user))


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest) -> dict:
    return envelope({"message": f"Password reset instructions were sent to {request.email}."})


@router.post("/logout")
async def logout() -> dict:
    return envelope(None)
