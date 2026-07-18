# Assetra Backend

Assetra's backend is a modular monolith built with FastAPI and PostgreSQL.
It is one deployable application, split by business domain so that rental,
catalog, pricing, fulfillment, and financial workflows remain easy to find and
test.

## Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
docker compose up -d db
alembic upgrade head
python -m app.core.seed_demo
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

## Layout

- `app/core`: configuration, database, logging, and shared infrastructure
- `app/api`: API composition and cross-cutting HTTP concerns
- `app/modules`: business domains; each module owns its router, schemas,
  models, repository, and service layer as it grows
- `migrations`: Alembic database migrations
- `tests`: unit and API tests

Routes should stay thin. Validation belongs in schemas, persistence belongs in
repositories, and rental/business rules belong in services.

## Database

The first PostgreSQL schema is defined through Alembic in `migrations/versions`.
Run migrations from the `backend` directory after starting the local database:

```bash
alembic upgrade head
```

Seed demo data with:

```bash
python -m app.core.seed_demo
```
