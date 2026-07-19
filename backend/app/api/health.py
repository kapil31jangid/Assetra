"""
GET /api/v1/health

Returns:
  - status: "ok" | "degraded"
  - db: "connected" | "unreachable"
  - version: app version string
  - environment: local | staging | production

Used by Docker healthchecks, uptime monitors, and the ops team.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session

router = APIRouter()


@router.get("/health", tags=["system"])
async def health_check(db: AsyncSession = Depends(get_db_session)) -> dict:
    db_status = "unreachable"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    overall = "ok" if db_status == "connected" else "degraded"
    return {
        "status": overall,
        "db": db_status,
        "version": "0.1.0",
    }
