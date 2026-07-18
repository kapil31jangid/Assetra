# Assetra Rental Management System

## Purpose

Assetra is a single-organization rental management platform. Customers browse products, choose rental periods, pay rental charges and security deposits, view orders, and access invoices. Admin and vendor users manage products, pricing, quotations, pickup, returns, inspections, late fees, deposits, refunds, and dashboards.

## Technology

- Frontend: React, TypeScript, Vite, Material UI, React Router, TanStack Query, Axios.
- Backend: Python 3.12+, FastAPI, Pydantic, SQLAlchemy 2.x, Alembic.
- Database: PostgreSQL 16.
- Payments: provider interface with a deterministic sandbox provider.
- Authentication: PBKDF2 password hashing and signed bearer access tokens.

## Architecture

Assetra is a modular monolith: one deployable FastAPI application split into business modules.

```text
React frontend -> FastAPI /api/v1 -> domain services -> SQLAlchemy -> PostgreSQL
```

Modules:

- `auth`: users, authentication, sessions, roles, and profiles.
- `catalog`: categories, products, variants, SKUs, accessories, and stock.
- `pricing`: pricelists, rental units, discounts, and pricing rules.
- `rentals`: quotations, rental orders, schedules, availability, and lifecycle state.
- `fulfillment`: pickup, return, checklists, inspection, damage, and photos.
- `payments`: payment intents, deposits, refunds, idempotency, and late fees.
- `invoices`: invoice headers, lines, totals, and downloads.
- `quotations`: quotation templates and quotation records.
- `organizations`: currency, tax, grace period, deposit, and late-fee settings.
- `dashboard`: operational KPIs and upcoming pickup/return data.

Routes remain thin. Pydantic handles validation, services hold business rules, SQLAlchemy handles persistence, and transactions protect multi-table workflows.

## Main rental workflow

```text
quotation -> quotation_sent -> confirmed -> invoiced -> reserved -> picked_up -> returned
```

1. Customer selects a product, variant, quantity, and rental interval.
2. Backend validates availability and calculates rental amount, discount, tax, delivery, deposit, and total.
3. Backend creates an immutable rental order snapshot.
4. A payment intent is created and confirmed through the sandbox provider.
5. Stock is reserved and the security deposit is recorded as held.
6. Staff completes pickup with a checklist.
7. Staff completes return inspection with checklist, damage, accessory, notes, and photos.
8. Backend compares actual return time with scheduled return plus grace period.
9. Late fees are calculated using the configured unit and maximum.
10. The deposit is fully refunded for a clean on-time return, or charges are deducted and the remainder refunded.

## Database

Alembic manages the schema. Main tables include:

`organizations`, `users`, `user_sessions`, `addresses`, `product_categories`, `products`, `product_variants`, `pricelists`, `pricing_rules`, `rental_orders`, `rental_order_lines`, `fulfillment_events`, `payments`, `deposit_transactions`, `late_fee_assessments`, `invoices`, `invoice_lines`, `quotation_templates`, `quotations`, and `quotation_lines`.

Orders and invoices store customer/product snapshots so historical records remain stable after later edits.

## API

Base URL: `/api/v1`. Responses use `data`, `meta`, and pagination fields for lists.

- `/session` — login, signup, logout, current session, and profile.
- `/products` — catalog listing, detail, and product creation.
- `/pricelists` — pricing configuration.
- `/rental-orders` — order list, detail, creation, and status transitions.
- `/rental-orders/{id}/fulfillment` — pickup and return.
- `/payments` — payment intent, confirmation, and refund.
- `/invoices` — invoice list, detail, and download.
- `/quotations` — quotation list, creation, and templates.
- `/settings` — organization configuration.
- `/dashboard/summary` — operational KPIs.

OpenAPI documentation is available at `/docs` when the backend is running.

## Security

Passwords are hashed and never stored as plain text. Protected endpoints require bearer authentication. Customers can only access their own data. Admin/vendor operations require role authorization. Payment confirmation supports idempotency keys. Production must use a strong `ASSETRA_JWT_SECRET_KEY`, HTTPS, restricted CORS, database backups, and no demo credentials.

## Run commands

### First-time setup

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e '.[dev]'
cp .env.example .env
docker compose up -d db
alembic upgrade head
python -m app.core.seed_demo
```

Demo accounts use password `password`:

```text
admin@assetra.local
vendor@assetra.local
nisha@example.com
```

### Start backend

Terminal 1:

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

URLs:

```text
API:    http://localhost:8000/api/v1
Docs:   http://localhost:8000/docs
Health: http://localhost:8000/api/v1/health
```

### Start frontend

Terminal 2:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

To specify the API explicitly:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run dev
```

The real API is the default. Mock mode is optional UI-only mode:

```bash
VITE_USE_MOCK_API=true npm run dev
```

### Quality checks

```bash
cd backend
source .venv/bin/activate
ruff check app migrations
pytest -q
python -m compileall -q app migrations

cd ../frontend
npm run build
npm run format:check
```

### Database commands

```bash
cd backend
source .venv/bin/activate
alembic current
alembic history
alembic upgrade head
python -m app.core.seed_demo
```

Stop PostgreSQL while keeping data:

```bash
cd backend
docker compose stop db
```

Start it again:

```bash
cd backend
docker compose start db
```

Destroy the local database volume only intentionally:

```bash
cd backend
docker compose down -v
```

## Troubleshooting

Check database status with `cd backend && docker compose ps`. If migrations fail, ensure the virtual environment is active and run `alembic upgrade head` from `backend`. If the frontend cannot reach the API, verify port 8000 and `VITE_API_BASE_URL=http://localhost:8000/api/v1`.

## Production checklist

- Use managed PostgreSQL with backups and point-in-time recovery.
- Set `ASSETRA_DEBUG=false` and a strong JWT secret.
- Restrict `ASSETRA_FRONTEND_ORIGIN` to the deployed frontend domain.
- Run `alembic upgrade head` during deployment.
- Do not run demo seeding in production.
- Use HTTPS and secret management.
- Replace the sandbox provider with a real payment implementation when required.
- Monitor health checks, errors, payments, refunds, and backups.

