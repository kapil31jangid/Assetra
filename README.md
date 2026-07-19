# Assetra — Rental Management System

A full-stack rental management platform built with **FastAPI** (Python 3.12) + **PostgreSQL** on the backend and **React + Vite** on the frontend.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Quick Start (Docker)](#quick-start-docker)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Running Migrations](#running-migrations)
6. [Seeding Demo Data](#seeding-demo-data)
7. [Verify Everything Works](#verify-everything-works)
8. [Frontend (local dev)](#frontend-local-dev)
9. [Common Dev Commands](#common-dev-commands)
10. [Environment Variables Reference](#environment-variables-reference)
11. [Production Considerations](#production-considerations)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | ≥ 24 | https://docs.docker.com/get-docker/ |
| Docker Compose | ≥ 2.20 (plugin, `docker compose`) | bundled with Docker Desktop |
| Node.js | ≥ 20 | https://nodejs.org (for frontend local dev only) |
| Git | any | https://git-scm.com |

> **Note:** Python is **not** required on your host — it runs entirely inside the Docker container.

---

## Project Structure

```
Assetra/
├── docker-compose.yml        ← compose file for postgres + backend
├── .env.example              ← template — copy to .env and fill in
├── .env                      ← your secrets (gitignored)
├── backend/
│   ├── Dockerfile            ← Python 3.12-slim image
│   ├── entrypoint.sh         ← runs migrations → (seed) → uvicorn
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── migrations/           ← Alembic migration files
│   └── app/
│       ├── main.py
│       ├── api/
│       │   └── health.py     ← GET /api/v1/health (DB connectivity probe)
│       └── core/
│           ├── config.py     ← pydantic-settings, reads from ASSETRA_* env vars
│           └── seed_runner.py ← standalone idempotent seed script
└── frontend/                 ← Vite + React (run locally with npm run dev)
```

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/kapil31jangid/Assetra.git
cd Assetra

# 2. Create your .env
cp .env.example .env
# Edit .env — at minimum set POSTGRES_PASSWORD and ASSETRA_JWT_SECRET_KEY

# 3. Build and start postgres + backend + frontend
docker compose up --build -d

# 4. Seed demo data (first run only)
docker compose exec backend python -m app.core.seed_runner

# 5. Verify
curl http://localhost:8000/api/v1/health
# Expected: {"status":"ok","db":"connected","version":"0.1.0"}
```

That's it. 
- The **Frontend App** is at `http://localhost:8080`.
- The **Backend API** is at `http://localhost:8000`.

---

## Step-by-Step Setup

### Step 1 — Create `.env`

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable | Required | Example value |
|----------|----------|---------------|
| `POSTGRES_PASSWORD` | ✅ | `SuperSecret123!` |
| `ASSETRA_JWT_SECRET_KEY` | ✅ | run `openssl rand -hex 32` |
| `POSTGRES_DB` | optional | `assetra` (default) |
| `POSTGRES_USER` | optional | `assetra` (default) |
| `POSTGRES_PORT` | optional | `5432` (default) |
| `BACKEND_PORT` | optional | `8000` (default) |
| `ASSETRA_SEED_ON_STARTUP` | optional | `false` — see [Seeding](#seeding-demo-data) |

### Step 2 — Build and start

```bash
docker compose up --build -d
```

This will:
- Pull `postgres:16-alpine` and build the Python backend image
- Start postgres with a healthcheck
- Wait until postgres is healthy, then start the backend
- The backend entrypoint **automatically runs `alembic upgrade head`** before starting uvicorn

To watch startup logs in real time:

```bash
docker compose logs -f
```

### Step 3 — Wait for ready

Postgres readiness is enforced by compose's healthcheck (`pg_isready`).  
The backend won't start until postgres returns healthy.

Confirm both services are `healthy` / `running`:

```bash
docker compose ps
```

---

## Running Migrations

Migrations run **automatically** every time the backend container starts (via `entrypoint.sh`).

> **Tradeoff:** Auto-migrate on startup is convenient for local development.  
> For **production** deployments, run migrations as a separate controlled step before rolling out a new image:
> ```bash
> docker compose run --rm backend alembic upgrade head
> ```
> This prevents schema changes from racing with live traffic.

### Run migrations manually (any time)

```bash
docker compose exec backend alembic upgrade head
```

### Roll back one migration

```bash
docker compose exec backend alembic downgrade -1
```

### Check current migration state

```bash
docker compose exec backend alembic current
docker compose exec backend alembic history --verbose
```

---

## Seeding Demo Data

The seed script creates:
- **Default organization** (Assetra Rental Company)
- **3 demo users** — all with password `Admin@123`

| Email | Role |
|-------|------|
| `admin@assetra.local` | admin |
| `vendor@assetra.local` | vendor |
| `nisha@example.com` | customer |

- **4 product categories** (Camera Gear, AV Equipment, Sports, Events)
- **3 sample products** with variants
- **Default pricelist**

### Option A — Run seed once manually (recommended)

```bash
docker compose exec backend python -m app.core.seed_runner
```

The script is **idempotent** — safe to run multiple times; existing records are skipped.

### Option B — Auto-seed on startup

In `.env`, set:
```
ASSETRA_SEED_ON_STARTUP=true
```

Then restart the backend:
```bash
docker compose restart backend
```

> Switch back to `false` after the first run. Running seed on every restart adds unnecessary startup time.

---

## Verify Everything Works

### Health check

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{"status": "ok", "db": "connected", "version": "0.1.0"}
```

### Interactive API docs

Open in your browser: http://localhost:8000/docs

### Test login

```bash
curl -s -X POST http://localhost:8000/api/v1/session/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assetra.local","password":"Admin@123"}' | python3 -m json.tool
```

Expected: a JSON response with `data.accessToken`.

---

## Frontend (local dev)

The frontend is **not containerized** — run it locally alongside Docker:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server: http://localhost:5173  
It proxies API calls to `http://localhost:8000` (configured in `vite.config.ts`).

If your backend is on a different port, update `VITE_API_BASE_URL` in `frontend/.env`.

---

## Common Dev Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service only
docker compose logs -f backend
docker compose logs -f postgres

# Open a psql shell
docker compose exec postgres psql -U assetra -d assetra

# Open a Python shell inside the backend container
docker compose exec backend python

# Run the backend's test suite
docker compose exec backend python -m pytest

# Stop all services (keeps volumes)
docker compose down

# Stop + destroy all volumes (full reset)
docker compose down -v

# Full clean rebuild (remove image cache too)
docker compose down -v
docker compose build --no-cache
docker compose up -d

# Reset database from scratch (dev workflow)
docker compose down -v                     # destroy db volume
docker compose up -d                       # fresh postgres + auto-migrate
docker compose exec backend python -m app.core.seed_runner   # re-seed
```

---

## Environment Variables Reference

All variables the backend reads are prefixed with `ASSETRA_` and can be set in `.env`.

| Variable | Default | Description |
|----------|---------|-------------|
| `ASSETRA_DATABASE_URL` | *(auto-set by compose)* | Full SQLAlchemy async DSN |
| `ASSETRA_JWT_SECRET_KEY` | `change-me` | HMAC secret for JWT signing — **must change** |
| `ASSETRA_ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT lifetime |
| `ASSETRA_DEBUG` | `false` | Enable FastAPI debug mode |
| `ASSETRA_ENVIRONMENT` | `local` | `local` / `staging` / `production` |
| `ASSETRA_FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `ASSETRA_SEED_ON_STARTUP` | `false` | Auto-run seed on container start |
| `ASSETRA_TAX_RATE` | `18.0` | GST % applied to rentals |
| `ASSETRA_DEFAULT_CURRENCY` | `INR` | Default currency code |
| `POSTGRES_DB` | `assetra` | Database name |
| `POSTGRES_USER` | `assetra` | Database user |
| `POSTGRES_PASSWORD` | **required** | Database password |
| `POSTGRES_PORT` | `5432` | Host-side port mapping |
| `BACKEND_PORT` | `8000` | Host-side port for the API |
| `FRONTEND_PORT` | `8080` | Host-side port for the Frontend |
| `UVICORN_WORKERS` | `1` | Number of uvicorn worker processes |
| `UVICORN_LOG_LEVEL` | `info` | `debug` / `info` / `warning` / `error` |

---

## Production Considerations

1. **Migrations:** Do **not** rely on auto-migrate in production. Run `alembic upgrade head` as a pre-deploy step in your CI/CD pipeline, before routing traffic to the new backend image.

2. **JWT secret:** Generate a 256-bit secret with `openssl rand -hex 32`. Never reuse the dev value.

3. **Secrets management:** Use a proper secrets manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) instead of a `.env` file.

4. **CORS:** Set `ASSETRA_FRONTEND_ORIGIN` to your exact production frontend URL. Wildcards (`*`) are not used.

5. **Workers:** Set `UVICORN_WORKERS` to `(2 × CPU cores) + 1` for production. For async FastAPI apps, a single worker per container with horizontal scaling is often preferable.

6. **Uploads:** The `/app/uploads` volume stores user-uploaded images. In production, replace this with cloud object storage (S3/GCS) and update the upload endpoint accordingly.

7. **Health checks:** Point your load balancer / orchestrator health probe at `GET /api/v1/health`. It returns `200 OK` only when the database is reachable.
