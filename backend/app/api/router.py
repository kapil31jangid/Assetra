from fastapi import APIRouter

from app.api.health import router as health_router
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import category_router, router as catalog_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.fulfillment.router import router as fulfillment_router
from app.modules.invoices.router import router as invoices_router
from app.modules.pricing.router import router as pricing_router
from app.modules.payments.router import router as payments_router
from app.modules.organizations.router import router as organizations_router
from app.modules.quotations.router import router as quotations_router
from app.modules.rentals.router import router as rentals_router
from app.modules.uploads.router import router as uploads_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router, prefix="/session", tags=["session"])
api_router.include_router(catalog_router, prefix="/products", tags=["products"])
api_router.include_router(category_router, prefix="/categories", tags=["categories"])
api_router.include_router(rentals_router, prefix="/rental-orders", tags=["rental-orders"])
api_router.include_router(fulfillment_router, prefix="/rental-orders", tags=["fulfillment"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["invoices"])
api_router.include_router(pricing_router, prefix="/pricelists", tags=["pricing"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(organizations_router, tags=["organization"])
api_router.include_router(quotations_router, prefix="/quotations", tags=["quotations"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
