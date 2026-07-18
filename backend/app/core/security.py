"""Small dependency-free security helpers for the modular monolith."""

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 240_000)
    return f"pbkdf2_sha256$240000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str | None) -> bool:
    if not encoded or not encoded.startswith("pbkdf2_sha256$"):
        return False
    _, rounds, salt_hex, digest_hex = encoded.split("$", 3)
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds)
    ).hex()
    return hmac.compare_digest(candidate, digest_hex)


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_access_token(user_id: str, role: str) -> tuple[str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(json.dumps({"sub": user_id, "role": role, "exp": int(expires_at.timestamp())}, separators=(",", ":")).encode())
    unsigned = f"{header}.{payload}"
    signature = _b64(hmac.new(settings.jwt_secret_key.encode(), unsigned.encode(), hashlib.sha256).digest())
    return f"{unsigned}.{signature}", expires_at


def decode_access_token(token: str) -> dict:
    try:
        header, payload, signature = token.split(".")
        unsigned = f"{header}.{payload}"
        expected = _b64(hmac.new(settings.jwt_secret_key.encode(), unsigned.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        data = json.loads(_unb64(payload))
        if int(data["exp"]) <= int(datetime.now(UTC).timestamp()):
            raise ValueError
        return data
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")


def bearer_token(request: Request) -> str:
    value = request.headers.get("Authorization", "")
    if value.lower().startswith("bearer "):
        return value[7:].strip()
    cookie = request.cookies.get(settings.session_cookie_name)
    if cookie:
        return cookie
    raise HTTPException(status_code=401, detail="Authentication required")


def current_claims(token: str = Depends(bearer_token)) -> dict:
    return decode_access_token(token)


def require_roles(*roles: str):
    def dependency(claims: dict = Depends(current_claims)) -> dict:
        if claims.get("role") not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission for this action")
        return claims

    return dependency
