import asyncio
from datetime import date, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import SessionLocal
from app.core.model_registry import *  # noqa: F403
from app.core.seed_data import INVOICES, ORDERS, PRICELISTS, PRODUCTS, USERS
from app.modules.auth.models import User
from app.modules.catalog.models import Product, ProductCategory, ProductVariant
from app.modules.invoices.models import Invoice, InvoiceLine
from app.modules.pricing.models import Pricelist, PricingRule
from app.modules.rentals.models import RentalOrder, RentalOrderLine


def parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value)


def money_amount(value: dict[str, Any]) -> float:
    return float(value["amount"])


def money_currency(value: dict[str, Any]) -> str:
    return str(value["currency"])


async def seed_users(session: AsyncSession) -> None:
    for user in USERS.values():
        await session.merge(
            User(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                role=user["role"],
                active=True,
            )
        )


async def seed_catalog(session: AsyncSession) -> None:
    categories: dict[str, dict[str, str]] = {}
    for product in PRODUCTS:
        categories[product["category"]["id"]] = product["category"]

    for category in categories.values():
        await session.merge(
            ProductCategory(
                id=category["id"],
                name=category["name"],
                slug=category["slug"],
            )
        )

    for product in PRODUCTS:
        deposit = product["depositPolicy"]
        await session.merge(
            Product(
                id=product["id"],
                category_id=product["category"]["id"],
                name=product["name"],
                slug=product["slug"],
                description=product.get("description"),
                brand=product.get("brand"),
                colors=product.get("colors", []),
                tags=product.get("tags", []),
                image_urls=product.get("imageUrls", []),
                attributes=product.get("attributes", []),
                accessories=product.get("accessories", []),
                deposit_required=deposit["required"],
                deposit_amount=money_amount(deposit["amount"]),
                deposit_currency=money_currency(deposit["amount"]),
                deposit_refundable=deposit["refundable"],
                deposit_refund_window_days=deposit.get("refundWindowDays"),
                repair_status=product["repairStatus"],
                availability_status=product["availabilityStatus"],
                rental_units=product["rentalUnits"],
                active=product["active"],
            )
        )

        for variant in product["variants"]:
            stock = variant["stock"]
            await session.merge(
                ProductVariant(
                    id=variant["id"],
                    product_id=product["id"],
                    name=variant["name"],
                    sku=variant["sku"],
                    attribute_value_ids=variant["attributeValueIds"],
                    repair_status=variant["repairStatus"],
                    stock_total=stock["total"],
                    stock_available=stock["available"],
                    stock_reserved=stock["reserved"],
                    stock_in_use=stock["inUse"],
                    stock_under_repair=stock["underRepair"],
                    image_url=variant.get("imageUrl"),
                )
            )


async def seed_pricing(session: AsyncSession) -> None:
    for pricelist in PRICELISTS:
        await session.merge(
            Pricelist(
                id=pricelist["id"],
                name=pricelist["name"],
                currency=pricelist["currency"],
                selectable=pricelist["selectable"],
                active=pricelist["active"],
            )
        )
        for rule in pricelist["rules"]:
            fixed_price = rule.get("fixedPrice")
            await session.merge(
                PricingRule(
                    id=rule["id"],
                    pricelist_id=pricelist["id"],
                    period_unit=rule["periodUnit"],
                    kind=rule["kind"],
                    fixed_price_amount=money_amount(fixed_price) if fixed_price else None,
                    fixed_price_currency=money_currency(fixed_price) if fixed_price else None,
                    discount_percent=rule.get("discountPercent"),
                    minimum_quantity=rule["minimumQuantity"],
                    valid_from=date.fromisoformat(rule["validFrom"]) if rule.get("validFrom") else None,
                    valid_to=date.fromisoformat(rule["validTo"]) if rule.get("validTo") else None,
                    selectable=rule["selectable"],
                )
            )


async def seed_orders(session: AsyncSession) -> None:
    for order in ORDERS:
        await session.merge(
            RentalOrder(
                id=order["id"],
                number=order["number"],
                customer_user_id="usr_customer",
                customer_snapshot=order["customer"],
                vendor_id=order.get("vendorId"),
                status=order["status"],
                schedule=order["schedule"],
                price=order["price"],
                deposit=order["deposit"],
                deposit_transactions=order["depositTransactions"],
                late_fees=order["lateFees"],
                damage_reports=order["damageReports"],
            )
        )

        for line in order["lines"]:
            period = line["rentalPeriod"]
            await session.merge(
                RentalOrderLine(
                    id=line["id"],
                    order_id=order["id"],
                    product_id=line["productId"],
                    variant_id=line["variantId"],
                    product_name=line["productName"],
                    variant_name=line["variantName"],
                    sku=line["sku"],
                    quantity=line["quantity"],
                    rental_starts_at=parse_datetime(period["startsAt"]),
                    rental_ends_at=parse_datetime(period["endsAt"]),
                    rental_unit=period["unit"],
                    rental_quantity=period["quantity"],
                    rental_timezone=period["timezone"],
                    unit_price_amount=money_amount(line["unitPrice"]),
                    unit_price_currency=money_currency(line["unitPrice"]),
                    line_total_amount=money_amount(line["lineTotal"]),
                    line_total_currency=money_currency(line["lineTotal"]),
                    accessories_snapshot=line["accessories"],
                )
            )


async def seed_invoices(session: AsyncSession) -> None:
    for invoice in INVOICES:
        await session.merge(
            Invoice(
                id=invoice["id"],
                number=invoice["number"],
                order_id=invoice.get("orderId"),
                customer_snapshot=invoice["customer"],
                status=invoice["status"],
                subtotal_amount=money_amount(invoice["subtotal"]),
                subtotal_currency=money_currency(invoice["subtotal"]),
                tax_amount=money_amount(invoice["tax"]),
                tax_currency=money_currency(invoice["tax"]),
                total_amount=money_amount(invoice["total"]),
                total_currency=money_currency(invoice["total"]),
                due_at=date.fromisoformat(invoice["dueAt"]) if invoice.get("dueAt") else None,
                issued_at=parse_datetime(invoice["issuedAt"]) if invoice.get("issuedAt") else None,
            )
        )
        for line in invoice["lines"]:
            await session.merge(
                InvoiceLine(
                    id=line["id"],
                    invoice_id=invoice["id"],
                    description=line["description"],
                    quantity=line["quantity"],
                    unit_price_amount=money_amount(line["unitPrice"]),
                    unit_price_currency=money_currency(line["unitPrice"]),
                    total_amount=money_amount(line["total"]),
                    total_currency=money_currency(line["total"]),
                )
            )


async def seed_demo_data() -> None:
    async with SessionLocal() as session:
        async with session.begin():
            await seed_users(session)
            await seed_catalog(session)
            await seed_pricing(session)
            await seed_orders(session)
            await seed_invoices(session)


def main() -> None:
    asyncio.run(seed_demo_data())


if __name__ == "__main__":
    main()
