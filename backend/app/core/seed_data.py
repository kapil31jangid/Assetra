from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4


def inr(amount: int | float) -> dict[str, Any]:
    return {"amount": amount, "currency": "INR"}


USERS: dict[str, dict[str, str]] = {
    "admin@assetra.local": {
        "id": "usr_admin",
        "name": "Aarav Mehta",
        "email": "admin@assetra.local",
        "role": "admin",
    },
    "vendor@assetra.local": {
        "id": "usr_vendor",
        "name": "Kabir Sethi",
        "email": "vendor@assetra.local",
        "role": "vendor",
    },
    "nisha@example.com": {
        "id": "usr_customer",
        "name": "Nisha Rao",
        "email": "nisha@example.com",
        "role": "customer",
    },
}


PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "prd_camera_01",
        "name": "Sony Alpha Camera Kit",
        "slug": "sony-alpha-camera-kit",
        "description": "Mirrorless camera body with standard lens and carry kit.",
        "category": {"id": "cat_camera", "name": "Camera Gear", "slug": "camera-gear"},
        "brand": "Sony",
        "colors": ["Black"],
        "tags": ["camera", "events", "photo"],
        "imageUrls": [],
        "attributes": [
            {
                "id": "attr_lens",
                "name": "Lens",
                "displayType": "select",
                "values": [{"id": "lens_35", "label": "35mm"}],
            }
        ],
        "variants": [
            {
                "id": "var_camera_35",
                "productId": "prd_camera_01",
                "name": "35mm Lens Kit",
                "sku": "CAM-SONY-A7-35",
                "attributeValueIds": ["lens_35"],
                "repairStatus": "ready",
                "stock": {"total": 12, "available": 8, "reserved": 3, "inUse": 1, "underRepair": 0},
            }
        ],
        "accessories": [
            {
                "id": "acc_battery",
                "name": "Extra battery",
                "quantityRequired": 1,
                "quantityAvailable": 24,
                "included": True,
            }
        ],
        "depositPolicy": {
            "required": True,
            "amount": inr(15000),
            "refundable": True,
            "refundWindowDays": 3,
        },
        "repairStatus": "ready",
        "stock": {"total": 12, "available": 8, "reserved": 3, "inUse": 1, "underRepair": 0},
        "availabilityStatus": "available",
        "rentalUnits": ["daily", "weekly"],
        "active": True,
    },
    {
        "id": "prd_projector_01",
        "name": "Epson Conference Projector",
        "slug": "epson-conference-projector",
        "description": "Portable HD projector for meetings and events.",
        "category": {"id": "cat_av", "name": "Audio Visual", "slug": "audio-visual"},
        "brand": "Epson",
        "colors": ["White"],
        "tags": ["projector", "conference"],
        "imageUrls": [],
        "attributes": [],
        "variants": [
            {
                "id": "var_projector_hd",
                "productId": "prd_projector_01",
                "name": "HD 4000 Lumens",
                "sku": "AV-EPSON-HD",
                "attributeValueIds": [],
                "repairStatus": "ready",
                "stock": {"total": 9, "available": 4, "reserved": 2, "inUse": 2, "underRepair": 1},
            }
        ],
        "accessories": [
            {
                "id": "acc_hdmi",
                "name": "HDMI cable",
                "quantityRequired": 1,
                "quantityAvailable": 14,
                "included": True,
            }
        ],
        "depositPolicy": {
            "required": True,
            "amount": inr(8000),
            "refundable": True,
            "refundWindowDays": 3,
        },
        "repairStatus": "ready",
        "stock": {"total": 9, "available": 4, "reserved": 2, "inUse": 2, "underRepair": 1},
        "availabilityStatus": "partially_available",
        "rentalUnits": ["daily", "weekly", "monthly"],
        "active": True,
    },
    {
        "id": "prd_speaker_01",
        "name": "JBL Event Speaker Pair",
        "slug": "jbl-event-speaker-pair",
        "description": "Powered speakers with stands for halls, events, and parties.",
        "category": {"id": "cat_audio", "name": "Sound Systems", "slug": "sound-systems"},
        "brand": "JBL",
        "colors": ["Black"],
        "tags": ["audio", "speaker", "events"],
        "imageUrls": [],
        "attributes": [],
        "variants": [
            {
                "id": "var_speaker_pair",
                "productId": "prd_speaker_01",
                "name": "Pair with stands",
                "sku": "AUD-JBL-1000W",
                "attributeValueIds": [],
                "repairStatus": "ready",
                "stock": {"total": 7, "available": 5, "reserved": 1, "inUse": 1, "underRepair": 0},
            }
        ],
        "accessories": [],
        "depositPolicy": {
            "required": True,
            "amount": inr(12000),
            "refundable": True,
            "refundWindowDays": 3,
        },
        "repairStatus": "ready",
        "stock": {"total": 7, "available": 5, "reserved": 1, "inUse": 1, "underRepair": 0},
        "availabilityStatus": "available",
        "rentalUnits": ["daily", "weekly"],
        "active": True,
    },
]


PRICELISTS: list[dict[str, Any]] = [
    {
        "id": "pl_standard",
        "name": "Standard Rental",
        "currency": "INR",
        "selectable": True,
        "active": True,
        "rules": [
            {
                "id": "rule_daily",
                "periodUnit": "daily",
                "kind": "fixed_price",
                "fixedPrice": inr(2500),
                "minimumQuantity": 1,
                "selectable": True,
            }
        ],
    }
]


ORDERS: list[dict[str, Any]] = [
    {
        "id": "ord_1001",
        "number": "RO-1001",
        "customer": {
            "id": "cus_01",
            "name": "Nisha Rao",
            "email": "nisha@example.com",
            "phone": "+91 98765 43210",
        },
        "vendorId": "ven_01",
        "status": "reserved",
        "lines": [
            {
                "id": "line_1001_1",
                "productId": "prd_camera_01",
                "variantId": "var_camera_35",
                "productName": "Sony Alpha Camera Kit",
                "variantName": "35mm Lens Kit",
                "sku": "CAM-SONY-A7-35",
                "quantity": 1,
                "rentalPeriod": {
                    "startsAt": "2026-07-20T10:00:00+05:30",
                    "endsAt": "2026-07-23T10:00:00+05:30",
                    "unit": "daily",
                    "quantity": 3,
                    "timezone": "Asia/Kolkata",
                },
                "unitPrice": inr(2500),
                "lineTotal": inr(7500),
                "accessories": [],
            }
        ],
        "schedule": {
            "mode": "store_pickup",
            "scheduledPickupAt": "2026-07-20T10:00:00+05:30",
            "scheduledReturnAt": "2026-07-23T10:00:00+05:30",
            "gracePeriodMinutes": 30,
        },
        "price": {
            "rental": inr(7500),
            "delivery": inr(0),
            "discount": inr(0),
            "deposit": inr(15000),
            "tax": inr(1350),
            "total": inr(23850),
        },
        "deposit": {
            "required": True,
            "amount": inr(15000),
            "refundable": True,
            "refundWindowDays": 3,
        },
        "depositTransactions": [],
        "lateFees": [],
        "damageReports": [],
        "fulfillmentEvents": [],
        "invoiceIds": ["inv_1001"],
        "createdAt": "2026-07-18T09:30:00+05:30",
        "updatedAt": "2026-07-18T10:05:00+05:30",
    }
]


INVOICES: list[dict[str, Any]] = [
    {
        "id": "inv_1001",
        "number": "INV-1001",
        "orderId": "ord_1001",
        "customer": {"id": "cus_01", "name": "Nisha Rao", "email": "nisha@example.com"},
        "status": "posted",
        "lines": [
            {
                "id": "inv_line_1001",
                "description": "Sony Alpha Camera Kit rental",
                "quantity": 3,
                "unitPrice": inr(2500),
                "total": inr(7500),
            }
        ],
        "subtotal": inr(7500),
        "tax": inr(1350),
        "total": inr(8850),
        "dueAt": "2026-07-20",
        "issuedAt": "2026-07-18T10:10:00+05:30",
        "createdAt": "2026-07-18T10:10:00+05:30",
    }
]


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def build_session(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "user": deepcopy(user),
        "expiresAt": (datetime.now(UTC) + timedelta(hours=12)).isoformat(),
    }


def clone_list(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return deepcopy(items)


def clone_item(item: dict[str, Any]) -> dict[str, Any]:
    return deepcopy(item)
