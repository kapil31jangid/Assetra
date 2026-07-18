from dataclasses import dataclass
from uuid import uuid4


@dataclass(frozen=True)
class PaymentResult:
    reference: str
    status: str


class SandboxPaymentProvider:
    name = "sandbox"

    def authorize(self, amount: float, currency: str, idempotency_key: str) -> PaymentResult:
        return PaymentResult(reference=f"sandbox_{uuid4().hex[:20]}", status="succeeded")

    def refund(self, reference: str, amount: float, currency: str) -> PaymentResult:
        return PaymentResult(reference=f"refund_{uuid4().hex[:20]}", status="succeeded")
