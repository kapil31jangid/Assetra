# Assetra Project Guide

## Product purpose

Assetra centralizes the rental lifecycle described in the supplied Rental Management System requirements: browse a product, choose a rental interval, pay for the rental and security deposit, collect or receive the product, return it for inspection, calculate any late/damage charges, and refund the remaining deposit.

## Architecture

Assetra is a single-organization modular monolith. FastAPI exposes one versioned API process, SQLAlchemy persists the domain in PostgreSQL, and Alembic owns schema changes. The React application consumes the API through typed query/mutation adapters.

Business modules are isolated by responsibility:

- Auth owns credentials, sessions, roles, and access checks.
- Catalog owns products, variants, accessories, stock, and availability data.
- Pricing owns pricelists and rental price rules.
- Rentals owns quotations-to-order lifecycle and immutable order snapshots.
- Fulfillment owns pickup, return, checklists, inspection, and stock movement decisions.
- Payments owns the provider boundary, payment attempts, deposits, refunds, and late-fee assessments.
- Invoices owns invoice records and downloadable invoice output.
- Quotations owns templates and quotation records.
- Organizations owns operational defaults such as currency, tax, grace period, and late-fee policy.
- Dashboard owns read-only operational KPIs.

Routes are deliberately thin. Persistent writes must happen through service-level transactions so inventory, order status, payment, deposit, and invoice changes cannot partially commit.

## Security model

Passwords use PBKDF2-HMAC-SHA256 with a per-password salt. API sessions use signed short-lived bearer tokens. Admin and vendor operations require role checks; customers are restricted to their own account, orders, invoices, and payments. Production deployments must replace `ASSETRA_JWT_SECRET_KEY` and disable demo seeding.

## Lifecycle

`quotation -> quotation_sent -> confirmed -> reserved -> picked_up -> returned`

Cancellation is allowed before pickup according to the transition table. Return processing compares actual return time with the scheduled return plus the configured grace period. A late return creates a late-fee assessment. The deposit ledger then records a full refund or deductions for late/damage/accessory charges and refunds the remainder.

## Extension rules

Add a new business capability as a module, keep request/response schemas separate from SQLAlchemy entities, put calculations in pure services where possible, and add an Alembic migration for every persistence change. Do not add business data to frontend local storage or seed dictionaries.

## Current implementation boundary

The sandbox payment provider is deterministic and provider-shaped, so a real gateway can be introduced by implementing the provider interface and configuring credentials without changing rental or deposit services. Invoice downloads currently use a portable text representation; a PDF renderer can be added behind the invoice download service without changing the invoice domain model.
