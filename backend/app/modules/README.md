# Business module convention

Each business module should grow using the same internal shape:

```text
module_name/
  router.py       # HTTP endpoints only
  schemas.py      # Pydantic request/response models
  models.py       # SQLAlchemy persistence models
  repository.py   # Database queries
  service.py      # Business rules and transactions
  dependencies.py # Module-specific FastAPI dependencies, when needed
```

Not every module needs every file on day one. Keep cross-module calls going
through services or explicit query objects rather than importing route
handlers from another module.

Domain ownership:

- `auth`: authentication, sessions, roles, permissions
- `catalog`: products, variants, physical rental units, availability
- `pricing`: pricelists, rental rates, deposits, late-fee rules
- `rentals`: quotations, orders, reservations, lifecycle transitions
- `fulfillment`: pickup, return, inspection, damage, maintenance
- `invoices`: invoices, payments, refunds, financial allocations
- `dashboard`: read-only operational KPIs and schedules
