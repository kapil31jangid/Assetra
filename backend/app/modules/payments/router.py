from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.responses import envelope
from app.core.database import get_db_session
from app.core.ids import new_id
from app.core.security import current_claims, require_roles
from app.modules.payments.models import DepositTransaction, Payment
from app.modules.payments.provider import SandboxPaymentProvider
from app.modules.catalog.models import ProductVariant
from app.modules.rentals.models import RentalOrder

router = APIRouter()
provider = SandboxPaymentProvider()


class PaymentIntentRequest(BaseModel):
    orderId: str
    kind: str = "rental_and_deposit"
    idempotencyKey: str | None = None


class PaymentConfirmRequest(BaseModel):
    paymentId: str


@router.post("/intent", dependencies=[Depends(require_roles("admin", "vendor", "customer"))])
async def create_payment_intent(request: PaymentIntentRequest, db: AsyncSession = Depends(get_db_session), claims: dict = Depends(current_claims)) -> dict:
    order = await db.scalar(select(RentalOrder).where(RentalOrder.id == request.orderId))
    if order is None or (claims.get("role") == "customer" and order.customer_user_id != claims["sub"]):
        raise HTTPException(status_code=404, detail="Rental order could not be found")
    key = request.idempotencyKey or f"intent_{uuid4().hex}"
    existing = await db.scalar(select(Payment).where(Payment.idempotency_key == key))
    if existing:
        return envelope({"id": existing.id, "status": existing.status, "amount": {"amount": float(existing.amount), "currency": existing.currency}, "provider": existing.provider})
    amount = float(order.price["total"]["amount"])
    payment = Payment(id=new_id("pay"), order_id=order.id, user_id=order.customer_user_id, provider=provider.name, kind=request.kind, status="requires_confirmation", amount=amount, currency=order.price["total"].get("currency", "INR"), idempotency_key=key)
    db.add(payment)
    await db.commit()
    return envelope({"id": payment.id, "status": payment.status, "amount": {"amount": amount, "currency": payment.currency}, "provider": provider.name})


@router.post("/confirm", dependencies=[Depends(require_roles("admin", "vendor", "customer"))])
async def confirm_payment(request: PaymentConfirmRequest, db: AsyncSession = Depends(get_db_session), claims: dict = Depends(current_claims)) -> dict:
    payment = await db.scalar(select(Payment).where(Payment.id == request.paymentId))
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if claims.get("role") == "customer" and payment.user_id != claims["sub"]:
        raise HTTPException(status_code=403, detail="Payment does not belong to this customer")
    if payment.status == "succeeded":
        return envelope({"id": payment.id, "status": payment.status, "reference": payment.provider_reference})
    result = provider.authorize(float(payment.amount), payment.currency, payment.idempotency_key or payment.id)
    payment.status = result.status
    payment.provider_reference = result.reference
    payment.processed_at = datetime.now(UTC)
    if payment.order_id:
        order = await db.scalar(select(RentalOrder).options(selectinload(RentalOrder.lines), selectinload(RentalOrder.fulfillment_events), selectinload(RentalOrder.invoices)).where(RentalOrder.id == payment.order_id))
        if order and order.status in {"quotation", "quotation_sent", "confirmed", "invoiced"}:
            order.status = "reserved"
            for line in order.lines:
                variant = await db.get(ProductVariant, line.variant_id)
                if variant:
                    variant.stock_reserved += line.quantity
                    variant.stock_available = max(0, variant.stock_available - line.quantity)
            db.add(DepositTransaction(id=new_id("dep"), order_id=order.id, payment_id=payment.id, type="hold", amount=float(order.price["deposit"]["amount"]), currency=payment.currency, note="Security deposit held at checkout"))
    await db.commit()
    return envelope({"id": payment.id, "status": payment.status, "reference": payment.provider_reference})


class RefundRequest(BaseModel):
    amount: float = Field(gt=0)
    note: str | None = None


@router.post("/{payment_id}/refund", dependencies=[Depends(require_roles("admin", "vendor"))])
async def refund_payment(payment_id: str, request: RefundRequest, db: AsyncSession = Depends(get_db_session)) -> dict:
    payment = await db.get(Payment, payment_id)
    if payment is None or payment.status != "succeeded" or not payment.provider_reference:
        raise HTTPException(status_code=409, detail="Payment is not refundable")
    result = provider.refund(payment.provider_reference, request.amount, payment.currency)
    db.add(Payment(id=new_id("pay"), order_id=payment.order_id, user_id=payment.user_id, provider=provider.name, provider_reference=result.reference, kind="refund", status=result.status, amount=request.amount, currency=payment.currency, processed_at=datetime.now(UTC)))
    if payment.order_id:
        db.add(DepositTransaction(id=new_id("dep"), order_id=payment.order_id, payment_id=payment.id, type="refund", amount=request.amount, currency=payment.currency, note=request.note))
    await db.commit()
    return envelope({"status": result.status, "reference": result.reference, "amount": {"amount": request.amount, "currency": payment.currency}})
