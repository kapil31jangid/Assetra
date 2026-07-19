# ──────────────────────────────────────────────────────────────────────────────
# Assetra Backend — Dockerfile
# Base: python:3.12-slim  (Debian Bookworm)
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim AS base

# System-level dependencies needed by psycopg (libpq) and Pillow (if added later)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for runtime security
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

# ── Dependency layer (cached unless pyproject.toml changes) ──────────────────
FROM base AS deps

COPY pyproject.toml ./
# Install the package + its dependencies in editable mode so imports resolve
RUN pip install --no-cache-dir -e "."

# ── Final image ───────────────────────────────────────────────────────────────
FROM deps AS runtime

# Copy application source
COPY --chown=app:app . .

# Ensure the uploads directory exists and is writable
RUN mkdir -p /app/uploads && chown app:app /app/uploads

# Make the entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER app

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
