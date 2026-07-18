from datetime import datetime

from app.modules.rentals.models import RentalOrder


def order_payload(order: RentalOrder) -> dict:
    return {
        "id": order.id,
        "number": order.number,
        "customer": order.customer_snapshot,
        "vendorId": order.vendor_id,
        "status": order.status,
        "lines": [{"id": line.id, "productId": line.product_id, "variantId": line.variant_id, "productName": line.product_name, "variantName": line.variant_name, "sku": line.sku, "quantity": line.quantity, "rentalPeriod": {"startsAt": line.rental_starts_at.isoformat(), "endsAt": line.rental_ends_at.isoformat(), "unit": line.rental_unit, "quantity": line.rental_quantity, "timezone": line.rental_timezone}, "unitPrice": {"amount": float(line.unit_price_amount), "currency": line.unit_price_currency}, "lineTotal": {"amount": float(line.line_total_amount), "currency": line.line_total_currency}, "accessories": line.accessories_snapshot} for line in order.lines],
        "schedule": order.schedule,
        "price": order.price,
        "deposit": order.deposit,
        "depositTransactions": order.deposit_transactions,
        "lateFees": order.late_fees,
        "damageReports": order.damage_reports,
        "fulfillmentEvents": [{"id": event.id, "type": event.type, "occurredAt": event.occurred_at.isoformat(), "recordedBy": event.recorded_by_snapshot, "checklist": event.checklist, "notes": event.notes, "photos": event.photos} for event in order.fulfillment_events],
        "invoiceIds": [invoice.id for invoice in order.invoices],
        "createdAt": order.created_at.isoformat(),
        "updatedAt": order.updated_at.isoformat(),
    }


def parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
