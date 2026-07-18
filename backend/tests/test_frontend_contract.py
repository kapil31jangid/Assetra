import pytest

from app.main import app
from app.modules.auth.router import LoginRequest, login
from app.modules.catalog.router import list_products
from app.modules.dashboard.router import dashboard_summary
from app.modules.rentals.router import UpdateRentalOrderStatusRequest, update_order_status


def test_frontend_contract_routes_are_registered() -> None:
    routes = {route.path for route in app.routes if hasattr(route, "methods")}

    assert "/api/v1/session/login" in routes
    assert "/api/v1/products" in routes
    assert "/api/v1/products/{product_id}" in routes
    assert "/api/v1/rental-orders" in routes
    assert "/api/v1/rental-orders/{order_id}/status" in routes
    assert "/api/v1/rental-orders/{order_id}/fulfillment" in routes
    assert "/api/v1/invoices" in routes
    assert "/api/v1/pricelists" in routes
    assert "/api/v1/dashboard/summary" in routes


@pytest.mark.asyncio
async def test_session_login_returns_contract_envelope() -> None:
    body = await login(LoginRequest(email="admin@assetra.local", password="password"))

    assert body["data"]["user"]["role"] == "admin"
    assert "requestId" in body["meta"]


@pytest.mark.asyncio
async def test_products_are_paginated() -> None:
    body = await list_products(page=1, pageSize=2)

    assert len(body["data"]) == 2
    assert body["pagination"]["total"] >= 2


@pytest.mark.asyncio
async def test_order_lifecycle_status_transition() -> None:
    body = await update_order_status(
        "ord_1001",
        UpdateRentalOrderStatusRequest(status="picked_up"),
    )

    assert body["data"]["status"] == "picked_up"


@pytest.mark.asyncio
async def test_dashboard_summary_shape() -> None:
    body = await dashboard_summary()

    assert body["data"]["period"]["from"] == "2026-07-01"
    assert body["data"]["kpis"]
