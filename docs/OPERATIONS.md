# Operations Guide

## Configure the workspace

Run migrations, seed demo data in development, then open Settings. Set the company name, currency, timezone, tax rate, deposit refund window, grace period, late-fee unit, late-fee amount, and maximum late fee.

## Products and pricing

Create a category, product, variants/SKUs, stock quantities, accessories, rental units, and deposit policy. Add a pricelist rule for each rental unit. Stock is not considered available when reserved, in use, under repair, or outside the requested rental interval.

## Customer checkout

Customers authenticate, browse active products, choose a variant and interval, select delivery or store pickup, review the server-calculated total, and confirm the sandbox payment. The order becomes reserved only after successful payment and the deposit is recorded as held.

## Pickup and return

Staff use the schedule to open a reserved order, complete the pickup checklist, and confirm pickup. At return, staff record the checklist, condition, missing accessories, photos, and damage. The service computes late time after the grace period, applies the configured capped fee, updates the order, and moves stock to available or repair/inspection state.

## Deposit settlement

An on-time clean return refunds the full held deposit. Late fees, damage, and missing accessories are separate ledger deductions. The customer receives the remaining balance and the order retains every hold, deduction, and refund transaction for reconciliation.
