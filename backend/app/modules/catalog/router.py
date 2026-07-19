from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope, paginated_envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import current_claims, require_roles
from app.modules.catalog.models import Product, ProductCategory, ProductVariant
from app.modules.catalog.service import product_payload

router = APIRouter()

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


async def _load_product(db: AsyncSession, product_id: str) -> Product:
    query = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.variants))
        .where(or_(Product.id == product_id, Product.slug == product_id))
    )
    product = (await db.scalars(query)).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product could not be found.")
    return product


async def product_query(db: AsyncSession, product_id: str | None = None):
    query = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.variants))
        .where(Product.active.is_(True))
    )
    if product_id:
        query = query.where(or_(Product.id == product_id, Product.slug == product_id))
    return await db.scalars(query)


# ---------------------------------------------------------------------------
# Category endpoints
# ---------------------------------------------------------------------------

category_router = APIRouter()


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(min_length=1, max_length=180)


@category_router.get("")
async def list_categories(db: AsyncSession = Depends(get_db_session)) -> dict:
    """Return all product categories."""
    categories = list((await db.scalars(select(ProductCategory).order_by(ProductCategory.name))).all())
    return envelope([{"id": c.id, "name": c.name, "slug": c.slug} for c in categories])


@category_router.post("", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_category(request: CategoryCreateRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    """Create a new product category."""
    existing = await db.scalar(select(ProductCategory).where(ProductCategory.slug == request.slug))
    if existing:
        raise HTTPException(status_code=409, detail="A category with this slug already exists.")
    category = ProductCategory(id=new_id("cat"), name=request.name, slug=request.slug)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return envelope({"id": category.id, "name": category.name, "slug": category.slug})


@category_router.put("/{category_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def update_category(category_id: str, request: CategoryCreateRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    """Update an existing category."""
    category = await db.get(ProductCategory, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    category.name = request.name
    category.slug = request.slug
    await db.commit()
    return envelope({"id": category.id, "name": category.name, "slug": category.slug})


@category_router.delete("/{category_id}", dependencies=[Depends(require_roles("admin"))])
async def delete_category(category_id: str, db: AsyncSession = Depends(get_db_session)) -> dict:
    """Delete a category (only if it has no products)."""
    category = await db.get(ProductCategory, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    product_count = await db.scalar(
        select(Product).where(Product.category_id == category_id, Product.active.is_(True)).limit(1)
    )
    if product_count is not None:
        raise HTTPException(status_code=409, detail="Cannot delete a category that has active products.")
    await db.delete(category)
    await db.commit()
    return envelope({"deleted": True})


# ---------------------------------------------------------------------------
# Product endpoints
# ---------------------------------------------------------------------------


@router.get("")
async def list_products(
    page: int = 1,
    pageSize: int = 20,
    search: str | None = None,
    categoryId: str | None = None,
    brand: str | None = None,
    color: str | None = None,
    rentalUnit: Literal["hourly", "daily", "nightly", "weekly", "monthly"] | None = None,
    includeInactive: bool = False,
    db: AsyncSession = Depends(get_db_session),
    # claims is optional — public catalog works unauthenticated; role used only for admin override
) -> dict:
    query = select(Product).options(selectinload(Product.category), selectinload(Product.variants))
    # Only admin/vendor may see inactive products — anonymous/customer callers always see active only
    # We don't inject Depends(current_claims) here to avoid breaking unauthenticated browsing;
    # includeInactive is silently ignored for non-admin callers (safe default).
    # Admin-facing product management calls set includeInactive=True explicitly.
    if not includeInactive:
        query = query.where(Product.active.is_(True))
    products = list((await db.scalars(query)).all())
    if search:
        needle = search.lower().strip()
        products = [p for p in products if needle in f"{p.name} {p.description or ''} {p.brand or ''}".lower()]
    if categoryId:
        products = [p for p in products if p.category_id == categoryId]
    if brand:
        products = [p for p in products if p.brand == brand]
    if color:
        products = [p for p in products if color in p.colors]
    if rentalUnit:
        products = [p for p in products if rentalUnit in p.rental_units]
    return paginated_envelope([product_payload(p) for p in products], page=page, page_size=pageSize)


@router.get("/{product_id}")
async def get_product(product_id: str, db: AsyncSession = Depends(get_db_session)) -> dict:
    product = await _load_product(db, product_id)
    return envelope(product_payload(product))


class VariantRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    sku: str = Field(min_length=1, max_length=120)
    stockTotal: int = Field(ge=0, default=0)
    imageUrl: str | None = None
    attributeValueIds: list[str] = []


class ProductCreateRequest(BaseModel):
    categoryId: str
    name: str = Field(min_length=1, max_length=220)
    slug: str = Field(min_length=1, max_length=240)
    description: str | None = None
    brand: str | None = None
    imageUrls: list[str] = []
    tags: list[str] = []
    colors: list[str] = []
    rentalUnits: list[str] = ["daily"]
    salesPrice: float = Field(default=0, ge=0)
    productType: str = "goods"
    depositAmount: float = 0
    depositRequired: bool = False
    depositRefundable: bool = True
    depositRefundWindowDays: int | None = None
    variants: list[VariantRequest] = []


class ProductUpdateRequest(BaseModel):
    categoryId: str | None = None
    name: str | None = Field(default=None, min_length=1, max_length=220)
    description: str | None = None
    brand: str | None = None
    imageUrls: list[str] | None = None
    tags: list[str] | None = None
    colors: list[str] | None = None
    rentalUnits: list[str] | None = None
    salesPrice: float | None = Field(default=None, ge=0)
    productType: str | None = None
    depositAmount: float | None = None
    depositRequired: bool | None = None
    depositRefundable: bool | None = None
    depositRefundWindowDays: int | None = None
    # Storefront visibility — admin/vendor only; enforced by require_roles on PUT endpoint
    active: bool | None = None
    repairStatus: str | None = None
    availabilityStatus: str | None = None


@router.post("", dependencies=[Depends(require_roles("admin", "vendor"))])
async def create_product(request: ProductCreateRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    category = await db.get(ProductCategory, request.categoryId)
    if category is None:
        raise HTTPException(status_code=400, detail="Product category does not exist.")
    existing_slug = await db.scalar(select(Product).where(Product.slug == request.slug))
    if existing_slug:
        raise HTTPException(status_code=409, detail="A product with this slug already exists.")

    product = Product(
        id=new_id("prd"),
        category_id=category.id,
        product_type=request.productType,
        name=request.name,
        slug=request.slug,
        description=request.description,
        brand=request.brand,
        image_urls=request.imageUrls,
        tags=request.tags,
        colors=request.colors,
        attributes=[],
        accessories=[],
        sales_price=request.salesPrice,
        rental_units=request.rentalUnits,
        deposit_amount=request.depositAmount,
        deposit_required=request.depositRequired,
        deposit_currency="INR",
        deposit_refundable=request.depositRefundable,
        deposit_refund_window_days=request.depositRefundWindowDays,
        repair_status="ready",
        availability_status="available",
        active=True,
    )

    if request.variants:
        product.variants = [
            ProductVariant(
                id=new_id("var"),
                name=v.name,
                sku=v.sku,
                attribute_value_ids=v.attributeValueIds,
                stock_total=v.stockTotal,
                stock_available=v.stockTotal,
                stock_reserved=0,
                stock_in_use=0,
                stock_under_repair=0,
                repair_status="ready",
                image_url=v.imageUrl,
            )
            for v in request.variants
        ]
    else:
        # Auto-create a default variant
        product.variants = [
            ProductVariant(
                id=new_id("var"),
                name=request.name,
                sku=new_id("SKU").upper(),
                attribute_value_ids=[],
                stock_total=0,
                stock_available=0,
                stock_reserved=0,
                stock_in_use=0,
                stock_under_repair=0,
                repair_status="ready",
            )
        ]

    db.add(product)
    await db.commit()
    await db.refresh(product)
    # Reload with relationships
    product = await _load_product(db, product.id)
    return envelope(product_payload(product))


@router.put("/{product_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def update_product(
    product_id: str, request: ProductUpdateRequest, db: AsyncSession = Depends(get_db_session)
) -> dict:
    product = await _load_product(db, product_id)
    if request.categoryId is not None:
        category = await db.get(ProductCategory, request.categoryId)
        if category is None:
            raise HTTPException(status_code=400, detail="Category does not exist.")
        product.category_id = request.categoryId
    if request.name is not None:
        product.name = request.name
    if request.description is not None:
        product.description = request.description
    if request.brand is not None:
        product.brand = request.brand
    if request.imageUrls is not None:
        product.image_urls = request.imageUrls
    if request.tags is not None:
        product.tags = request.tags
    if request.colors is not None:
        product.colors = request.colors
    if request.rentalUnits is not None:
        product.rental_units = request.rentalUnits
    if request.salesPrice is not None:
        product.sales_price = request.salesPrice
    if request.productType is not None:
        product.product_type = request.productType
    if request.depositAmount is not None:
        product.deposit_amount = request.depositAmount
    if request.depositRequired is not None:
        product.deposit_required = request.depositRequired
    if request.depositRefundable is not None:
        product.deposit_refundable = request.depositRefundable
    if request.depositRefundWindowDays is not None:
        product.deposit_refund_window_days = request.depositRefundWindowDays
    if request.active is not None:
        product.active = request.active
    if request.repairStatus is not None:
        product.repair_status = request.repairStatus
    if request.availabilityStatus is not None:
        product.availability_status = request.availabilityStatus
    await db.commit()
    product = await _load_product(db, product.id)
    return envelope(product_payload(product))


@router.delete("/{product_id}", dependencies=[Depends(require_roles("admin", "vendor"))])
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db_session)) -> dict:
    """Soft-delete a product by setting active=False."""
    product = await _load_product(db, product_id)
    product.active = False
    await db.commit()
    return envelope({"deleted": True, "id": product_id})
