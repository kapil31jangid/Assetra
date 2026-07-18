from fastapi import APIRouter, HTTPException

from app.api.responses import envelope, paginated_envelope
from app.core.seed_data import INVOICES, clone_item, clone_list


router = APIRouter()


@router.get("")
async def list_invoices(page: int = 1, pageSize: int = 20, search: str | None = None) -> dict:
    invoices = clone_list(INVOICES)
    if search:
        normalized_search = search.lower().strip()
        invoices = [
            invoice
            for invoice in invoices
            if normalized_search in invoice["number"].lower()
            or normalized_search in invoice["customer"]["name"].lower()
        ]

    return paginated_envelope(invoices, page=page, page_size=pageSize)


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str) -> dict:
    invoice = next((item for item in INVOICES if item["id"] == invoice_id), None)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice could not be found.")

    return envelope(clone_item(invoice))
