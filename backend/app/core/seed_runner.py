"""
Standalone seed runner — called from entrypoint.sh when ASSETRA_SEED_ON_STARTUP=true,
or manually via:

    docker compose exec backend python -m app.core.seed_runner

Creates:
  - Default organization
  - Admin / vendor / customer demo users  (password: Admin@123)
  - Product categories
  - Sample products with variants
  - Default pricelist
"""

import asyncio
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.model_registry import *  # noqa: F403 — ensure all models are registered
from app.core.models import Base, Organization
from app.core.security import hash_password
from app.modules.auth.models import User
from app.modules.catalog.models import Product, ProductCategory, ProductVariant
from app.modules.pricing.models import Pricelist, PricingRule

# ── Default password for all demo accounts ────────────────────────────────────
DEMO_PASSWORD = "Admin@123"

DEMO_USERS = [
    {"id": "usr_admin",    "name": "Aarav Mehta",  "email": "admin@assetra.local",  "role": "admin"},
    {"id": "usr_vendor",   "name": "Kabir Sethi",  "email": "vendor@assetra.local", "role": "vendor"},
    {"id": "usr_customer", "name": "Nisha Rao",    "email": "nisha@example.com",    "role": "customer"},
]

DEMO_CATEGORIES = [
    {"id": "cat_camera",  "name": "Camera Gear",     "slug": "camera-gear"},
    {"id": "cat_av",      "name": "AV Equipment",    "slug": "av-equipment"},
    {"id": "cat_sports",  "name": "Sports & Outdoor","slug": "sports-outdoor"},
    {"id": "cat_events",  "name": "Event Supplies",  "slug": "event-supplies"},
]

DEMO_PRODUCTS = [
    {
        "id": "prd_camera_01",
        "name": "Sony Alpha Camera Kit",
        "slug": "sony-alpha-camera-kit",
        "description": "Mirrorless camera body with standard lens and carry kit.",
        "category_id": "cat_camera",
        "brand": "Sony",
        "sales_price": 1500.0,
        "cost_price": 800.0,
        "deposit_amount": 5000.0,
        "rental_daily_rate": 1500.0,
        "product_type": "goods",
        "active": True,
        "qty_on_hand": 5,
        "variants": [{"id": "var_cam_01", "name": "Default", "sku": "SONY-A-KIT-01", "stock_available": 5}],
    },
    {
        "id": "prd_projector_01",
        "name": "4K Laser Projector",
        "slug": "4k-laser-projector",
        "description": "High-brightness 4K laser projector for events and presentations.",
        "category_id": "cat_av",
        "brand": "Epson",
        "sales_price": 2000.0,
        "cost_price": 1200.0,
        "deposit_amount": 8000.0,
        "rental_daily_rate": 2000.0,
        "product_type": "goods",
        "active": True,
        "qty_on_hand": 3,
        "variants": [{"id": "var_proj_01", "name": "Default", "sku": "EPSON-4K-01", "stock_available": 3}],
    },
    {
        "id": "prd_tent_01",
        "name": "Camping Tent (4-person)",
        "slug": "camping-tent-4p",
        "description": "All-weather 4-person dome tent with rain fly.",
        "category_id": "cat_sports",
        "brand": "Decathlon",
        "sales_price": 400.0,
        "cost_price": 200.0,
        "deposit_amount": 2000.0,
        "rental_daily_rate": 400.0,
        "product_type": "goods",
        "active": True,
        "qty_on_hand": 10,
        "variants": [{"id": "var_tent_01", "name": "Default", "sku": "TENT-4P-01", "stock_available": 10}],
    },
]


async def seed(db: AsyncSession) -> None:
    # ── Organization ──────────────────────────────────────────────────────────
    org = await db.scalar(select(Organization))
    if org is None:
        org = Organization(
            id="org_default",
            name="Assetra Rental Company",
            currency="INR",
            timezone="Asia/Kolkata",
            tax_rate=18,
            grace_period_minutes=30,
            late_fee_unit="hourly",
            late_fee_amount=250,
            late_fee_maximum=None,
            deposit_refund_window_days=3,
            active=True,
        )
        db.add(org)
        print("  ✓ Created organization")
    else:
        print("  · Organization already exists — skipping")

    # ── Demo users ────────────────────────────────────────────────────────────
    pw_hash = hash_password(DEMO_PASSWORD)
    for u in DEMO_USERS:
        existing = await db.scalar(select(User).where(User.id == u["id"]))
        if existing is None:
            db.add(User(
                id=u["id"],
                name=u["name"],
                email=u["email"],
                role=u["role"],
                password_hash=pw_hash,
                organization_id="org_default",
                active=True,
            ))
            print(f"  ✓ Created user {u['email']}")
        else:
            print(f"  · User {u['email']} already exists — skipping")

    # ── Categories ────────────────────────────────────────────────────────────
    for cat in DEMO_CATEGORIES:
        existing = await db.scalar(select(ProductCategory).where(ProductCategory.id == cat["id"]))
        if existing is None:
            db.add(ProductCategory(id=cat["id"], name=cat["name"], slug=cat["slug"]))
            print(f"  ✓ Created category '{cat['name']}'")
        else:
            print(f"  · Category '{cat['name']}' already exists — skipping")

    # ── Products & variants ───────────────────────────────────────────────────
    for p in DEMO_PRODUCTS:
        existing = await db.scalar(select(Product).where(Product.id == p["id"]))
        if existing is None:
            product = Product(
                id=p["id"],
                name=p["name"],
                slug=p["slug"],
                description=p["description"],
                category_id=p["category_id"],
                brand=p.get("brand"),
                sales_price=p["sales_price"],
                deposit_required=bool(p.get("deposit_amount", 0) > 0),
                deposit_amount=p.get("deposit_amount", 0),
                product_type=p["product_type"],
                active=p["active"],
            )
            db.add(product)
            for v in p["variants"]:
                db.add(ProductVariant(
                    id=v["id"],
                    product_id=p["id"],
                    name=v["name"],
                    sku=v["sku"],
                    stock_total=v["stock_available"],
                    stock_available=v["stock_available"],
                ))
            print(f"  ✓ Created product '{p['name']}'")
        else:
            print(f"  · Product '{p['name']}' already exists — skipping")

    # ── Default pricelist ─────────────────────────────────────────────────────
    existing_pl = await db.scalar(select(Pricelist).where(Pricelist.id == "pl_default"))
    if existing_pl is None:
        pl = Pricelist(
            id="pl_default",
            name="Standard Pricelist",
            selectable=True,
            active=True,
        )
        db.add(pl)
        print("  ✓ Created default pricelist")
    else:
        print("  · Default pricelist already exists — skipping")

    await db.commit()
    print("\n✅ Seed complete.")


async def main() -> None:
    print("\n🌱 Starting Assetra seed...")
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as db:
        await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
