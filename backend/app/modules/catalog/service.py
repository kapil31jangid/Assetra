from decimal import Decimal

from app.modules.catalog.models import Product


def money(amount: Decimal | float | int, currency: str = "INR") -> dict:
    return {"amount": float(amount), "currency": currency}


def product_payload(product: Product) -> dict:
    variants = [
        {
            "id": variant.id,
            "productId": product.id,
            "name": variant.name,
            "sku": variant.sku,
            "attributeValueIds": variant.attribute_value_ids,
            "repairStatus": variant.repair_status,
            "stock": {"total": variant.stock_total, "available": variant.stock_available, "reserved": variant.stock_reserved, "inUse": variant.stock_in_use, "underRepair": variant.stock_under_repair},
            "imageUrl": variant.image_url,
        }
        for variant in product.variants
    ]
    stock = {key: sum(getattr(v, source) for v in product.variants) for key, source in {"total": "stock_total", "available": "stock_available", "reserved": "stock_reserved", "inUse": "stock_in_use", "underRepair": "stock_under_repair"}.items()}
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "category": {"id": product.category.id, "name": product.category.name, "slug": product.category.slug},
        "brand": product.brand,
        "colors": product.colors,
        "tags": product.tags,
        "imageUrls": product.image_urls,
        "image": product.image_urls[0] if product.image_urls else None,
        "attributes": product.attributes,
        "variants": variants,
        "accessories": product.accessories,
        "productType": product.product_type,
        "type": product.product_type,
        "published": product.active,
        "salesPrice": float(product.sales_price),
        "depositPolicy": {"required": product.deposit_required, "amount": money(product.deposit_amount, product.deposit_currency), "refundable": product.deposit_refundable, "refundWindowDays": product.deposit_refund_window_days},
        "repairStatus": product.repair_status,
        "stock": stock,
        "availabilityStatus": product.availability_status,
        "rentalUnits": product.rental_units,
        "active": product.active,
        "qtyOnHand": stock["total"],
        "rentalSettings": {"periodicity": (product.rental_units[0] if product.rental_units else "day")},
        "deposit": {"required": product.deposit_required, "amount": float(product.deposit_amount)},
    }
