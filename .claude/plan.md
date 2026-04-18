# TatraSplit — Shared Payments for TatraBank (Hackathon Demo)

## Context

HackKosice challenge from Tatra banka: build an intuitive, demo-ready UX/UI for a **shared-payments** feature layered onto TatraBank's product surface — groups, automatic debt calculation, easy settlement. Inspired by MonoBank's "Group Expenses" (create a group from contacts, add expenses, send reminders) but a fresher take: visible math, one-tap settle, QR invites, and a dashboard that answers "who owes what?" at a glance.

The repo today is two clean scaffolds — React 19 + Vite 8 frontend (single boilerplate `App.jsx`, no router, no UI lib) and a FastAPI backend (only `/api/v1/health` registered, Pydantic v2, no DB). We're building the whole feature from green-field.

## Decisions (confirmed)

- **UI**: Tailwind + shadcn/ui, dark theme tuned to TatraBank's black/white aesthetic with one accent color.
- **Backend**: FastAPI + **MongoDB Atlas** via `motor` async driver. We lean into Atlas visibly — there's a sponsor-prize opportunity.
- **Auth**: hardcoded demo accounts (@misha, @lukas, @nina, @tomas), no login screen. A user-switcher dropdown in the app shell header lets you switch perspective. Selected handle stored in `localStorage`; sent as `X-User-Handle` header on every request. Backend `get_current_user()` reads that header, falls back to `settings.current_user_handle` env default.
- **Scope**: Core (groups, expenses, balance, settle) + **QR/share-link invites**, **expense categories + donut chart**, **activity feed**, **debt-simplification algorithm**.
- **Storage of money**: integer `amount_cents`. No floats anywhere in the pipeline.

## Architecture overview

```
Frontend (React 19 + Vite + Tailwind + shadcn + TanStack Query + axios)
   │  http://localhost:5173
   ▼
Backend (FastAPI + motor)   http://localhost:8000/api/v1
   │
   ▼
MongoDB Atlas  —  database: tatra_split
```

## MongoDB collections (database `tatra_split`)

All ids serialized as strings in API responses. Amounts in integer cents.

- **`users`** — `{_id, display_name, handle (unique), avatar_url, color, created_at}`
- **`groups`** — `{_id, name, emoji, currency, member_ids[], created_by, invite_token (unique), created_at}`
- **`expenses`** — `{_id, group_id, description, category, amount_cents, currency, paid_by, split[{user_id, share_cents}], split_type: equal|custom, created_by, created_at, note}`. Invariant: `sum(split.share_cents) == amount_cents` (server rebalances 1-cent rounding).
- **`settlements`** — `{_id, group_id, from_user, to_user, amount_cents, currency, method, created_at, note}`
- **`activity`** — `{_id, group_id|null, actor_id, kind, payload, created_at}` for feed.

Indexes: `users.handle` unique, `groups.invite_token` unique, `groups.member_ids`, `expenses.group_id + created_at desc`, `expenses.paid_by`, `expenses.split.user_id`, `settlements.group_id + created_at desc`, `activity.created_at desc`, `activity.group_id + created_at desc`.

## Backend routes (all under `/api/v1`)

Files live under [backend/app/api/routes/](backend/app/api/routes/), registered in [backend/app/main.py](backend/app/main.py).

- `users.py` — `GET /users/me`, `GET /users?q=`
- `groups.py` — `POST /groups`, `GET /groups`, `GET /groups/{id}`, `POST /groups/{id}/members`, `DELETE /groups/{id}/members/{user_id}`, `POST /groups/join/{invite_token}`, `GET /groups/{id}/invite`
- `expenses.py` — `POST /groups/{id}/expenses`, `GET /groups/{id}/expenses`, `GET /groups/{id}/expenses/{eid}`, `DELETE /groups/{id}/expenses/{eid}`
- `settlements.py` — `POST /groups/{id}/settlements`, `GET /groups/{id}/settlements`
- `balances.py` — `GET /groups/{id}/balances` (returns per-member net + `simplified_transfers`), `GET /me/balances` (cross-group rollup + `by_category_last_30d` for dashboard donut)
- `activity.py` — `GET /activity`, `GET /groups/{id}/activity`

Each endpoint is async, uses `Depends(get_db)` and `Depends(get_current_user)`. Mutations write an activity row in the same request.

### Services

- [backend/app/services/balances.py](backend/app/services/balances.py) — aggregation pipelines to compute per-member net for a group and cross-group rollup for current user.
- [backend/app/services/simplify.py](backend/app/services/simplify.py) — Splitwise-style **greedy max-creditor / max-debtor** pairing: two max-heaps (creditors, debtors), pop both, transfer `min(|a|,|b|)`, repeat. Produces ≤ n-1 transfers in O(n log n). Not provably minimal (NP-hard) but visibly clean; exactly what users expect.
- [backend/app/services/activity.py](backend/app/services/activity.py) — thin helper to append activity entries.
- [backend/app/services/seed.py](backend/app/services/seed.py) — creates `@misha` + `@lukas` + `@nina` + `@tomas`, two groups ("Roommates 🏠", "Tatras Trip ⛰️") with a handful of seeded expenses + one settlement. `--reset` flag drops collections first.

### Infrastructure

- [backend/app/core/db.py](backend/app/core/db.py) — `AsyncIOMotorClient`, startup ping, index creation, `get_db(request)` Depends.
- [backend/app/core/security.py](backend/app/core/security.py) — `get_current_user()` returns the user doc where `handle == settings.current_user_handle`; auto-creates it if missing.
- [backend/app/main.py](backend/app/main.py) — `@asynccontextmanager` lifespan to open/close motor and set `app.state.db`; register all routers.
- [backend/app/core/config.py](backend/app/core/config.py) — add `mongo_uri`, `mongo_db` (default `tatra_split`), `current_user_handle` (default `@misha`).
- [backend/requirements.txt](backend/requirements.txt) — add `motor>=3.6.0`, `pymongo>=4.9.0`.
- [backend/.env.example](backend/.env.example) — document `MONGO_URI`, `MONGO_DB`, `CURRENT_USER_HANDLE`.

## Frontend architecture

Base: [frontend/src/](frontend/src/).

**New deps**: `react-router-dom`, `@tanstack/react-query`, `axios`, `tailwindcss` + `@tailwindcss/vite`, `class-variance-authority clsx tailwind-merge lucide-react tailwindcss-animate`, `qrcode.react`, `recharts`, `date-fns`, `zod`, `react-hook-form`, `@hookform/resolvers`.

**shadcn components** (after `npx shadcn init` with dark preset):
`button card dialog sheet input label avatar badge tabs separator scroll-area sonner dropdown-menu tooltip skeleton chart toggle-group select`.

**State**: TanStack Query is the state layer. After each mutation we invalidate the affected keys (`['group', id]`, `['balances','me']`, `['group', id, 'activity']`). No Redux/Zustand needed.

### Key flows

**Create & invite** — `POST /groups` → redirect to detail → "Invite" button opens `QRInviteDialog` rendering a `qrcode.react` of `window.location.origin + "/join/" + token` with copy-link.

**Add expense** — big `MoneyInput`, category chips (`ToggleGroup`), payer avatars, `SplitEditor` (Equal/Custom tabs with live remainder bar). Submit invalidates group + balances.

**Settle up** — reads `simplified_transfers` from `/groups/:id/balances`; each row is "Misha → Lukas €12.50 [Mark paid]". Optimistic removal + `POST /settlements`. Empty state when done.


