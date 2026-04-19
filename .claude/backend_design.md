# Backend Design Guidelines

## Stack

- **FastAPI** — async, Pydantic v2 models, lifespan for DB connect/disconnect
- **Motor** — async MongoDB driver (`AsyncIOMotorClient`)
- **Pydantic-settings** — config from `.env` via `Settings` class

## Project layout

```
backend/app/
  main.py              # App entry: CORS, lifespan, router registration
  lib.py               # sdoc/sdocs — MongoDB → JSON-safe dict helpers
  core/
    config.py          # Settings (pydantic-settings, reads .env)
    db.py              # Motor client, index creation, get_db dep
    security.py        # get_current_user() — reads X-User-Handle header
  api/
    deps.py            # Re-exports get_db, get_current_user
    routes/            # One file per resource; each exports router
  models/              # Pydantic v2 request/response schemas (stubs)
  services/
    balances.py        # Aggregation logic for net balances
    simplify.py        # Greedy debt simplification (two max-heaps)
    activity.py        # append_activity() — writes activity rows
    recurring.py       # process_due() — creates expenses from due recurring entries
    seed.py            # Demo data; --reset drops collections, seeds 4 users with 500 EUR wallet each
```

## Auth

No real auth. `get_current_user` reads `X-User-Handle` header; falls back to `settings.current_user_handle` (`@misha`). Returns the user document or 401.

## Runtime config (CORS)

- CORS middleware in `app/main.py` is fully driven by `Settings` in `app/core/config.py`.
- Configure these env vars in `backend/.env` (template in `backend/.env.example`):
  - `CORS_ALLOW_ORIGINS` (comma-separated allowlist, e.g. localhost/127.0.0.1/LAN IP)
  - `CORS_ALLOW_ORIGIN_REGEX` (optional pattern allowlist)
  - `CORS_ALLOW_CREDENTIALS`, `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`

## Wallet

Users have a `balance_cents` field (seeded at 50000 = 500 EUR). Settlements deduct from payer's wallet and credit recipient's wallet atomically. This is the demo banking model — settlements require sufficient wallet balance.

## Serialization

Always use `sdoc(doc)` / `sdocs(docs)` from `app.lib` before returning MongoDB documents:
- `_id` → `id` (string)
- `ObjectId` fields → string
- `datetime` → ISO 8601 string

Never return raw Motor documents. Never access `doc["_id"]` in route handlers — use `sdoc` first, then `doc["id"]`.

## Money

Integer cents everywhere. Fields named `amount_cents`, `share_cents`, `net_cents`. No floats anywhere in the pipeline.

## Activity

Every mutation (create group, add expense, settle, join/invite) must call `append_activity(db, group_id, actor_id, kind, payload)`. Activity kinds: `group.created`, `group.member.invited`, `group.member.joined`, `group.member.left`, `expense.added`, `settlement.created`, `recurring.triggered`.

## Adding a new route

1. Create `api/routes/<resource>.py`, define `router = APIRouter(prefix="/<resource>", tags=["<resource>"])`
2. Import `get_db`, `get_current_user` from `app.api.deps`
3. Register in `main.py`: `app.include_router(<resource>_router, prefix=prefix)`

## Error handling

- 404 for missing or invalid ObjectId: `raise HTTPException(404, "...")`
- 403 for authorization failures
- Let FastAPI handle 422 validation errors automatically — do not catch them

## Conventions

- All route files import deps from `app.api.deps`, not directly from `app.core.*`
- `ObjectId.is_valid(id)` guard before every `ObjectId(id)` cast
- UTC timestamps: `datetime.now(timezone.utc)`
- Use `$addToSet` for array membership (idempotent), `$pull` for removal
- Pagination not implemented — all list endpoints return full results
