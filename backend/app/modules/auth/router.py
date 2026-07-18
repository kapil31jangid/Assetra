from fastapi import APIRouter


router = APIRouter()


@router.get("")
async def current_session() -> dict[str, None]:
    """Temporary contract endpoint; authentication will be added next."""
    return {"user": None}


@router.post("/logout")
async def logout() -> dict[str, None]:
    return {"data": None}
