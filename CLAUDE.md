# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reference dir

.claude

## Project

**TatraSplit** — a shared-payments/expense-splitting demo for HackKosice (TatraBank challenge). Users create groups, log expenses, view who owes whom, and settle debts. One hardcoded current user (`@misha`) — no login screen.

## Dev commands

**Submodule init (first time):**
```bash
git submodule update --init --recursive
```

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in MONGO_URI
python -m app.services.seed --reset   # seed demo data
uvicorn app.main:app --reload  # http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run lint
npm run build
```

**Swagger UI:** `http://localhost:8000/docs`

## Environment (`backend/.env`)

```
APP_NAME=TatraSplit API
DEBUG=true
API_PREFIX=/api/v1
MONGO_URI=mongodb+srv://<user>:<pw>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=tatra_split
CURRENT_USER_HANDLE=@misha
```

## Architecture

```
Frontend (React 19 + Vite + Tailwind + shadcn + TanStack Query + axios)
  http://localhost:5173
        ↓
Backend (FastAPI + Motor async driver)   http://localhost:8000/api/v1
        ↓
MongoDB Atlas  —  database: tatra_split
```



### Backend (`backend/app/`)

| Path | Role |
| --- | --- |
| `main.py` | FastAPI app, CORS, lifespan (Motor open/close), router registration |
| `core/config.py` | Pydantic settings — reads `.env` |
| `core/db.py` | `AsyncIOMotorClient`, startup ping, index creation, `get_db` Depends |
| `core/security.py` | `get_current_user()` — resolves user by `settings.current_user_handle` |
| `api/deps.py` | Shared FastAPI dependencies |
| `api/routes/` | One file per resource; register each router in `main.py` |
| `models/` | Pydantic v2 request/response models |
| `services/balances.py` | MongoDB aggregation pipelines for per-group and cross-group net balances |
| `services/simplify.py` | Greedy max-creditor/max-debtor debt simplification (Splitwise-style, two max-heaps, ≤ n-1 transfers) |
| `services/activity.py` | Helper to append activity log entries |
| `services/seed.py` | Creates demo users + groups + expenses; `--reset` drops collections first |

**Routes** (all under `/api/v1`):

- `users` — `GET /users/me`, `GET /users?q=`
- `groups` — CRUD, member management, `POST /groups/join/{invite_token}`, `GET /groups/{id}/invite`
- `expenses` — CRUD under `/groups/{id}/expenses`
- `settlements` — `POST /groups/{id}/settlements`, `GET /groups/{id}/settlements`
- `balances` — `GET /groups/{id}/balances` (returns `simplified_transfers`), `GET /me/balances` (cross-group + `by_category_last_30d` for donut chart)
- `activity` — `GET /activity`, `GET /groups/{id}/activity`

Every mutation also writes a row to the `activity` collection in the same request.

### MongoDB collections (`tatra_split`)

All `_id` fields serialized as strings in responses. **All amounts are integer cents — no floats anywhere.**

- `users` — `{_id, display_name, handle (unique), avatar_url, color, created_at}`
- `groups` — `{_id, name, emoji, currency, member_ids[], created_by, invite_token (unique), created_at}`
- `expenses` — `{_id, group_id, description, category, amount_cents, paid_by, split[{user_id, share_cents}], split_type: equal|custom, created_by, created_at, note}` — invariant: `sum(split.share_cents) == amount_cents` (server rebalances 1-cent rounding)
- `settlements` — `{_id, group_id, from_user, to_user, amount_cents, currency, method, created_at, note}`
- `activity` — `{_id, group_id|null, actor_id, kind, payload, created_at}`

### Frontend (`frontend/src/`)

| Path | Role |
| --- | --- |
| `main.jsx` | Entry — wraps `QueryClientProvider`, `BrowserRouter`, `<Toaster/>` |
| `App.jsx` | Route tree + `<AppShell>` |
| `lib/api.js` | Axios instance (base URL `/api/v1`) |
| `lib/queryKeys.js` | Centralized TanStack Query key factory |
| `lib/format.js` | Money (cents → display) and date formatting helpers |
| `hooks/` | `useMe`, `useGroups`, `useGroup`, `useActivity`, `useMutations` |
| `components/ui/` | shadcn-generated components (do not edit manually) |
| `components/layout/` | `AppShell`, `BottomNav` |
| `components/shared/` | Feature components: `BalancePill`, `ExpenseRow`, `GroupCard`, `QRInviteDialog`, `CategoryDonut`, `SplitEditor`, etc. |
| `pages/` | One file per route: Dashboard, GroupsList, GroupDetail, AddExpense, SettleUp, Activity, JoinGroup, NewGroup |

**State management:** TanStack Query only — no Redux/Zustand. After each mutation, invalidate `['group', id]`, `['balances', 'me']`, and `['group', id, 'activity']`.

**Routes:**

| Path | Page |
| --- | --- |
| `/` | Dashboard — cross-group balance, category donut, group list, recent activity |
| `/groups` | Full groups list |
| `/groups/new` | Create group |
| `/groups/:id` | Group detail — Expenses / Balances / Activity tabs |
| `/groups/:id/expenses/new` | Add expense |
| `/groups/:id/settle` | Settle up — simplified transfer list |
| `/activity` | Global activity feed |
| `/join/:token` | Auto-join via invite token (`?as=@handle` for live demo switching) |

## Key conventions

- **New backend route:** create `backend/app/api/routes/<name>.py`, register router in `backend/app/main.py`.
- **New model:** add to `backend/app/models/`.
- **All monetary values** are integer cents throughout frontend and backend.
- **Invite flow:** `POST /groups` returns `invite_token`; `QRInviteDialog` renders a QR of `window.location.origin + "/join/" + token`.
- **Debt simplification** lives in `services/simplify.py` — two max-heaps, greedy pairing. Guard `abs(net) < 1` for zero-balance edge cases.
- **Equal split rounding:** server distributes the 1-cent remainder deterministically (last participant gets it).
