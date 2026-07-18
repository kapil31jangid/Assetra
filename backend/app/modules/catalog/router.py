from typing import Literal

from fastapi import APIRouter, HTTPException

from app.api.responses import envelope, paginated_envelope
from app.core.seed_data import PRODUCTS, clone_item, clone_list


router = APIRouter()


@router.get("")
async def list_products(
    page: int = 1,
    pageSize: int = 20,
    search: str | None = None,
    categoryId: str | None = None,
    brand: str | None = None,
    color: str | None = None,
    rentalUnit: Literal["hourly", "daily", "nightly", "weekly", "monthly"] | None = None,
    minPrice: float | None = None,
    maxPrice: float | None = None,
) -> dict:
    normalized_search = search.lower().strip() if search else None
    products = []

    for product in clone_list(PRODUCTS):
        daily_rate = 2500
        searchable_text = " ".join(
            str(value)
            for value in [
                product.get("name"),
                product.get("description"),
                product.get("brand"),
                *product.get("tags", []),
            ]
            if value
        ).lower()

        if not product.get("active", False):
            continue
        if normalized_search and normalized_search not in searchable_text:
            continue
        if categoryId and product["category"]["id"] != categoryId:
            continue
        if brand and product.get("brand") != brand:
            continue
        if color and color not in product.get("colors", []):
            continue
        if rentalUnit and rentalUnit not in product.get("rentalUnits", []):
            continue
        if minPrice is not None and daily_rate < minPrice:
            continue
        if maxPrice is not None and daily_rate > maxPrice:
            continue

        products.append(product)

    return paginated_envelope(products, page=page, page_size=pageSize)


@router.get("/{product_id}")
async def get_product(product_id: str) -> dict:
    product = next(
        (item for item in PRODUCTS if item["id"] == product_id or item["slug"] == product_id),
        None,
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product could not be found.")

    return envelope(clone_item(product))
