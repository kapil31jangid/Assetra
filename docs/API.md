# Assetra API Guide

Base URL: `/api/v1`.

All JSON responses use either:

```json
{"data": {}, "meta": {"requestId": "...", "generatedAt": "..."}}
```

or the same shape with `pagination` for list endpoints. Protected requests send `Authorization: Bearer <accessToken>`.

## Endpoint groups

- `GET/POST /session`, `/session/login`, `/session/signup`, `/session/logout` — session lifecycle.
- `GET /products`, `GET /products/{id}`, `POST /products` — catalog reads and staff product creation.
- `GET/POST /pricelists` — pricing configuration.
- `GET/POST /rental-orders`, `GET /rental-orders/{id}`, `POST /rental-orders/{id}/status` — order lifecycle.
- `POST /rental-orders/{id}/fulfillment` — pickup and return confirmation.
- `POST /payments/intent`, `POST /payments/confirm`, `POST /payments/{id}/refund` — sandbox payment and settlement.
- `GET /invoices`, `GET /invoices/{id}`, `GET /invoices/{id}/download` — invoice access.
- `GET/PUT /settings` — organization configuration.
- `GET/POST /quotations`, `GET /quotations/templates` — quotation workflow.
- `GET /dashboard/summary` — operations KPIs.

Business conflicts use 409, validation failures use 422, missing resources use 404, and insufficient permissions use 403. Payment confirmation and provider events must always carry an idempotency key or provider reference.

## Checkout sequence

1. Customer creates a rental order in quotation state.
2. Client creates a payment intent using the order ID.
3. Client confirms the intent.
4. The payment service marks the payment succeeded, reserves stock, and records the deposit hold in one transaction.
5. Staff processes pickup and return fulfillment.
6. Return settlement creates late/damage assessments and deposit refund transactions.
