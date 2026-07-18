from fastapi import APIRouter

from app.api.responses import envelope
from app.core.seed_data import PRICELISTS, clone_list


router = APIRouter()


@router.get("")
async def list_pricelists() -> dict:
    return envelope(clone_list(PRICELISTS))
