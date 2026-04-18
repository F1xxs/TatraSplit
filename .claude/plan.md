# TatraSplit — Shared Payments for TatraBank (Hackathon Demo)

## Context

HackKosice challenge from Tatra banka: build an intuitive, demo-ready UX/UI for a **shared-payments** feature layered onto TatraBank's product surface — groups, automatic debt calculation, easy settlement. Inspired by MonoBank's "Group Expenses" (create a group from contacts, add expenses, send reminders) but a fresher take: visible math, one-tap settle, QR invites, and a dashboard that answers "who owes what?" at a glance.

## Decisions (confirmed)

- **UI**: Tailwind + shadcn/ui, dark theme tuned to TatraBank's black/white aesthetic with one accent color.
- **Backend**: FastAPI + **MongoDB Atlas** via `motor` async driver. Atlas SRV connection string (`mongodb+srv://`). No local MongoDB — Atlas is the only DB target.
- **Auth**: hardcoded demo accounts (@misha, @lukas, @nina, @tomas), no login screen. A user-switcher dropdown in the app shell header lets you switch perspective. Selected handle stored in `localStorage`; sent as `X-User-Handle` header on every request. Backend `get_current_user()` reads that header, falls back to `settings.current_user_handle` env default.
- **Scope**: Core (groups, expenses, balance, settle) + **QR/share-link invites**, **expense categories + donut chart**, **activity feed**, **debt-simplification algorithm**.
- **Storage of money**: integer `amount_cents`. No floats anywhere in the pipeline.

## Architecture overview

```
Frontend (React 19 + Vite + Tailwind + shadcn + TanStack Query + axios)
   │  http://localhost:5173
   ▼
Backend (FastAPI + motor)   http://localhost:8000/api/v1
   │  X-User-Handle header for auth
   ▼
MongoDB Atlas (SRV, TLS/SSL built-in)  —  database: tatra_split
```

## MongoDB Atlas setup

- Connection: `mongodb+srv://<user>:<pw>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=TatraSplit`
- Atlas handles connection pooling, TLS/SSL, and retryable writes automatically via Motor.
- `serverSelectionTimeoutMS=5000` — fast fail if Atlas unreachable.
- Network access: whitelist `0.0.0.0/0` for hackathon demo.
- **All reference IDs stored as strings** (not ObjectIds) in documents. Only `_id` is ObjectId.

## MongoDB collections (database `tatra_split`)

All ids serialized as strings in API responses. Amounts in integer cents.

- **`users`** — `{_id, display_name, handle (unique), avatar_url, color, created_at}`
- **`groups`** — `{_id, name, emoji, currency, member_ids[] (strings), created_by (string), invite_token (unique), created_at}`
- **`expenses`** — `{_id, group_id (string), description, category, amount_cents, currency, paid_by (string), split[{user_id (string), share_cents}], split_type: equal|custom, created_by (string), created_at, note}`. Invariant: `sum(split.share_cents) == amount_cents` — last participant absorbs rounding cent.
- **`settlements`** — `{_id, group_id (string), from_user (string), to_user (string), amount_cents, currency, method, created_at, note}`
- **`activity`** — `{_id, group_id (string)|null, actor_id (string), kind, payload, created_at}` for feed.

Indexes: `users.handle` unique, `groups.invite_token` unique sparse, `groups.member_ids`, `expenses.group_id + created_at desc`, `expenses.paid_by`, `expenses.split.user_id`, `settlements.group_id + created_at desc`, `activity.created_at desc`, `activity.group_id + created_at desc`.

## Backend routes (all under `/api/v1`)

Files live under `backend/app/api/routes/`, registered in `backend/app/main.py` via lifespan.

- `users.py` — `GET /users/me`, `GET /users?q=`
- `groups.py` — `POST /groups`, `GET /groups`, `GET /groups/{id}`, `POST /groups/{id}/members`, `DELETE /groups/{id}/members/{user_id}`, `POST /groups/join/{invite_token}[?as=@handle]`, `GET /groups/{id}/invite`
- `expenses.py` — `POST /groups/{id}/expenses`, `GET /groups/{id}/expenses`, `GET /groups/{id}/expenses/{eid}`, `DELETE /groups/{id}/expenses/{eid}`
- `settlements.py` — `POST /groups/{id}/settlements`, `GET /groups/{id}/settlements`
- `balances.py` — `GET /groups/{id}/balances` (returns per-member net + `simplified_transfers`), `GET /me/balances` (cross-group rollup + `by_category_last_30d` for dashboard donut)
- `activity.py` — `GET /activity`, `GET /groups/{id}/activity`

Each endpoint is async, uses `Depends(get_db)` and `Depends(get_current_user)`. Mutations write an activity row in the same request.

### Services

- `backend/app/services/balances.py` — per-group and cross-group net balance computation over expenses + settlements.
- `backend/app/services/simplify.py` — Splitwise-style **greedy max-creditor / max-debtor** pairing: two max-heaps, pop both, transfer `min(|a|,|b|)`, repeat. ≤ n-1 transfers, O(n log n).
- `backend/app/services/activity.py` — `append_activity(db, *, group_id, actor_id, kind, payload)` helper.
- `backend/app/services/seed.py` — creates @misha + @lukas + @nina + @tomas, two groups, expenses, one settlement. `--reset` drops collections first. Run: `python -m app.services.seed --reset`.

### Infrastructure

- `backend/app/core/db.py` — `AsyncIOMotorClient` with Atlas SRV URI, startup ping, index creation, `get_db(request)` Depends.
- `backend/app/core/security.py` — `get_current_user()`: reads `X-User-Handle` header, falls back to `settings.current_user_handle`.
- `backend/app/core/config.py` — `mongo_uri`, `mongo_db`, `current_user_handle` via pydantic-settings.
- `backend/app/lib.py` — `sdoc(doc)` / `sdocs(docs)`: serialize MongoDB docs (ObjectId→str, datetime→ISO, `_id`→`id`).
- `backend/app/main.py` — `@asynccontextmanager` lifespan: connect Atlas on startup, close on shutdown; all routers registered.

### SettleUp — Pay now (TODO)

The "Pay now" button on `SettleUpPage` currently shows a toast placeholder. Backend integration requires a TatraBank payment API call — marked as future work. When implemented: `POST /groups/{id}/payments` → calls bank API → on success inserts a settlement doc automatically.

## Frontend architecture

Base: `frontend/src/`.

**State**: TanStack Query only. After each mutation invalidate `['group', id]`, `['balances', 'me']`, `['group', id, 'activity']`.

### Routes

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Cross-group "you owe / owed to you", category donut, group list, recent activity |
| `/groups` | GroupsList | Full list |
| `/groups/new` | NewGroup | Create: name, emoji, currency, member picker |
| `/groups/:id` | GroupDetail | Tabs: Expenses / Balances / Activity + Invite + Settle buttons |
| `/groups/:id/expenses/new` | AddExpense | Amount → desc → category → payer → split (equal/custom) |
| `/groups/:id/settle` | SettleUp | "You owe" section (Mark as paid + Pay now) / "You are owed" section (Mark as paid) |
| `/activity` | ActivityPage | Global feed |
| `/join/:token` | JoinGroup | Auto-joins via invite token (`?as=@handle` for demo switching) |

## Verification (end-to-end)

`backend/.env`:
```
APP_NAME=TatraSplit API
DEBUG=true
API_PREFIX=/api/v1
MONGO_URI=mongodb+srv://<user>:<pw>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=TatraSplit
MONGO_DB=tatra_split
CURRENT_USER_HANDLE=@misha
```

Run:
```bash
# Backend
cd backend && source .venv/bin/activate
pip install -r requirements.txt
python -m app.services.seed --reset
uvicorn app.main:app --reload  # http://localhost:8000

# Frontend
cd frontend && npm install && npm run dev  # http://localhost:5173
```

Visit `http://localhost:5173` and walk the demo:
1. Dashboard shows non-zero "You owe / You are owed" + donut + 2 groups.
2. Open "Roommates" → see members, expenses, positive balance.
3. Add €20 groceries split equally → UI updates without reload.
4. "Settle up" → tap "Mark paid" on a simplified transfer → row removes, activity updates.
5. "Invite" → QR renders, copy link works.
6. `/activity` → chronological feed shows expense + settlement just created.
7. Swagger at `http://localhost:8000/docs` exposes all routes.

## Risks

- **Atlas network at demo time** — whitelist `0.0.0.0/0` in Atlas Network Access before the demo.
- **Rounding on equal splits** (€10/3 = 333/333/334) — last participant gets the remainder cent.
- **QR "join" feels fake with one real user** — `?as=@handle` on JoinGroup lets you live-demo joining as Lukas/Nina.
- **Debt simplification edge cases** (all-zero balances) — guarded by `abs(net) > 1` check.
- **Custom split UX is a rabbit hole** — ship equal-only first.
- **Pay now (TatraBank integration)** — stub toast for now; real bank API call is future work.
