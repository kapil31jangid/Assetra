# Deployment and Backup Guide

## Environment

Set `ASSETRA_DATABASE_URL`, `ASSETRA_JWT_SECRET_KEY`, `ASSETRA_FRONTEND_ORIGIN`, `ASSETRA_ENVIRONMENT`, and `ASSETRA_DEBUG=false`. Keep secrets in the deployment secret manager. Do not enable demo seeding in production.

## PostgreSQL

Run `docker compose up -d db` for local development. In production, use managed PostgreSQL with automated backups, point-in-time recovery, TLS, restricted network access, and a dedicated application role. Run `alembic upgrade head` during release deployment before starting the API.

## Health and release checks

Check `/api/v1/health`, verify database connectivity, run the backend tests and frontend build, then perform a login/catalog/order smoke test. Use structured request IDs from the API envelope for support and audit correlation.

## Backups and recovery

Back up PostgreSQL daily and retain multiple recovery points. Test restores regularly. Migrations are forward-only in production; repair a faulty migration with a new migration rather than editing an applied revision.
