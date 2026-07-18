from datetime import UTC, datetime
from math import ceil
from typing import Any
from uuid import uuid4


def meta() -> dict[str, str]:
    return {
        "requestId": f"api_{uuid4()}",
        "generatedAt": datetime.now(UTC).isoformat(),
    }


def envelope(data: Any) -> dict[str, Any]:
    return {"data": data, "meta": meta()}


def paginated_envelope(
    items: list[dict[str, Any]],
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    safe_page = max(page, 1)
    safe_page_size = min(max(page_size, 1), 100)
    start = (safe_page - 1) * safe_page_size
    total = len(items)

    return {
        "data": items[start : start + safe_page_size],
        "meta": meta(),
        "pagination": {
            "page": safe_page,
            "pageSize": safe_page_size,
            "total": total,
            "totalPages": max(1, ceil(total / safe_page_size)),
        },
    }
