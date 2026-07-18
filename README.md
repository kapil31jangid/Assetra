## Assetra Rental Management System

Assetra is a single-organization rental management system for customer self-service and staff operations. It supports product availability, pricing, quotations, rental orders, pickup/return inspections, security deposits, late fees, payments, invoices, and operational reporting.

### Quick start

1. Start PostgreSQL: `cd backend && docker compose up -d db`
2. Create the backend environment: `cd backend && cp .env.example .env` (or configure `ASSETRA_DATABASE_URL`).
3. Install backend dependencies: `python3 -m pip install -e '.[dev]'`.
4. Run migrations: `alembic upgrade head`.
5. Load optional demo data: `python -m app.core.seed_demo`.
6. Start the API: `uvicorn app.main:app --reload`.
7. Start the frontend: `cd frontend && npm ci && npm run dev`.

The API is available at `/api/v1` and its OpenAPI documentation is available at `/docs`. Demo accounts use the password `password`; never use those credentials outside local development.

### Architecture

The backend is a modular monolith. Each business module owns its models, schemas, repositories/services, routes, and tests. Services are responsible for business rules and transaction boundaries; routers only validate input, authorize the request, call a service, and serialize the response. PostgreSQL is the source of truth. The frontend defaults to the real API; mock mode is available only when `VITE_USE_MOCK_API=true`.

See [the complete project guide](docs/PROJECT_GUIDE.md), [API guide](docs/API.md), [operations guide](docs/OPERATIONS.md), and [deployment guide](docs/DEPLOYMENT.md).

The complete handoff document with architecture, workflows, database design, security, troubleshooting, and run commands is available in [FINAL_PROJECT_DOCUMENT.md](docs/FINAL_PROJECT_DOCUMENT.md).

### Quality checks

```bash
cd backend
ruff check app migrations
pytest -q
cd ../frontend
npm run build
```
