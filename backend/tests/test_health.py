from app.main import app


def test_health_route_is_registered() -> None:
    routes = {route.path for route in app.routes if hasattr(route, "methods")}

    assert "/api/v1/health" in routes
