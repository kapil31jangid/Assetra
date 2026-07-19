#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# Assetra backend entrypoint
#
# Order of operations:
#   1. Wait for Postgres to accept connections (compose healthcheck handles
#      the hard wait, but we retry here as a belt-and-suspenders guard).
#   2. Run `alembic upgrade head` — idempotent, safe to run on every restart.
#   3. Optionally seed initial data (set ASSETRA_SEED_ON_STARTUP=true).
#   4. Start uvicorn.
#
# NOTE: Auto-migrate-on-startup is convenient for local development.
# For production, run migrations as a separate controlled step before
# deploying the new image. See README § Production migrations.
# ──────────────────────────────────────────────────────────────────────────────

set -e

echo ">>> [entrypoint] Running Alembic migrations..."
alembic upgrade head

if [ "${ASSETRA_SEED_ON_STARTUP:-false}" = "true" ]; then
    echo ">>> [entrypoint] Running seed data..."
    python -m app.core.seed_runner
fi

echo ">>> [entrypoint] Starting uvicorn..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${UVICORN_WORKERS:-1}" \
    --log-level "${UVICORN_LOG_LEVEL:-info}"
