---
name: Backend implementation status
description: Only the health route is implemented; all other API endpoints are pending and served by the frontend mock layer
type: project
---

Only `GET /api/v1/health` is registered in `backend/app/main.py`. The services directory (`services/`) does not exist. There is no `seed.py`, `balances.py`, or `simplify.py`.

The full API contract documented in `.claude/api.md` is *intended* but unimplemented on the backend. The frontend mock layer (`lib/mock.js`) implements the entire contract client-side.

**Why:** Hackathon demo — frontend-first, backend implementation pending.

**How to apply:** When documenting backend routes, only list `health`. Do not reference `services/` files. Remove `python -m app.services.seed --reset` from dev commands. The mock layer is load-bearing for the app to work.
