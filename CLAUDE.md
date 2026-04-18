# CLAUDE.md

## Project

**TatraSplit** — shared-payments demo for HackKosice (TatraBank challenge). Groups, expenses, debt calculation, settlement. Demo account switcher (no login): selected handle is stored in `localStorage` (`tatrasplit_user_handle`) and sent as `X-User-Handle` (fallback `@misha`).

## Agent instructions

Before starting any task, read the relevant files in `.claude/`:

- `.claude/desgin_guidelines.md` — visual/UX rules, color tokens, component patterns
- `.claude/frontend_structure.md` — frontend architecture, data flow, conventions
- `.claude/api.md` — API contract (endpoints, request/response shapes)
- `.claude/backend_design.md` — backend architecture, conventions, route patterns
- `.claude/mongodb.md` — MongoDB collections, indexes, query patterns
- `.claude/tasks/00_index.md` — task status (done / skipped)

## Reference

`.claude/` — design guidelines, frontend structure doc, API contract, backend design, MongoDB guidelines, tasks index.

## Dev commands

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload   # http://localhost:8000

# Frontend
cd frontend && npm install
npm run dev    # http://localhost:5173
npm run lint
```

## Architecture

```
React 19 + Vite + Tailwind + shadcn + TanStack Query
  → FastAPI + Motor   http://localhost:8000/api/v1
    → MongoDB Atlas   db: tatra_split
```

## Backend (`backend/app/`)

| Path | Role |
|---|---|
| `main.py` | App entry, CORS, router registration |
| `core/config.py` | Pydantic settings from `.env` |
| `core/db.py` | Motor client, indexes, `get_db` dep |
| `core/security.py` | `get_current_user()` by handle |
| `api/routes/` | One file per resource (`health`, `users`, `groups`, `expenses`, `settlements`, `balances`, `activity`, `recurring`, `admin`) |
| `models/` | Pydantic v2 request/response schemas |
| `services/balances.py` | Net balance aggregation + debt simplification calls |
| `services/simplify.py` | Greedy debt simplification (two max-heaps) |
| `services/activity.py` | `append_activity()` — writes activity rows |
| `services/recurring.py` | `process_due()` — creates expenses from due recurring entries |
| `services/seed.py` | Demo data; `--reset` drops collections, seeds 4 users with 500 EUR wallet |

Routes (all `/api/v1`): `health`, `users`, `groups`, `expenses`, `settlements`, `balances`, `activity`, `recurring`, `admin` — all registered in `main.py`. Every mutation calls `append_activity()`.

## Frontend (`frontend/src/`)

| Path | Role |
|---|---|
| `main.jsx` | Bootstrap: QueryClient, BrowserRouter, ToastProvider |
| `App.jsx` | Routes with React.lazy + Suspense per page |
| `lib/api.js` | Axios instance; mock mode on by default |
| `lib/queryKeys.js` | TanStack Query key factory |
| `lib/normalize.js` | `normalizeEntity/List/Group` — ensures `id` field, strips `_id` |
| `lib/invalidation.js` | `invalidateGlobal(qc)`, `invalidateGroup(qc, id)` — used by all mutations |
| `lib/format.js` | `formatMoney(cents, currency)`, date helpers |
| `hooks/useMe.js` | `useMe`, `useMeBalances` |
| `hooks/useGroups.js` | `useGroups`, `useGroup`, `useGroupExpenses`, `useGroupBalances`, `useGroupActivity`, `useGroupSettlements`, `useActivity`, `useUsers` |
| `hooks/useRecurring.js` | `useGroupRecurring`, `useCreateRecurring`, `useDeleteRecurring`, `useProcessRecurring` |
| `hooks/useMutations.js` | `useCreateGroup`, `useDeleteGroup`, `useAddExpense`, `useSettle`, `usePayment`, `useJoinGroup` |
| `components/ui/` | Design system primitives (Button, Card, Dialog, Sheet, Tabs, Avatar, Badge, Input, Label, Separator, Skeleton, Toaster…) |
| `components/layout/` | `AppShell`, `BottomNav`, `TatraMark` |
| `components/shared/` | `GroupCard`, `ExpenseRow`, `ActivityItem`, `SplitEditor`, `MoneyInput`, `CategoryDonut`, `CategoryIcon`, `BalancePill`, `SplitDonut`, `QRInviteDialog`, `DataState` |
| `pages/` | Dashboard, GroupsList, GroupDetail (includes creator-only delete-group flow), AddExpense, SettleUp, Activity, NewGroup, JoinGroup, Payment, Admin |

## Key conventions

- **Money**: integer cents everywhere — `amount_cents`, `share_cents`, `net_cents`. Display via `formatMoney`.
- **IDs**: always `entity.id` (string). `normalizeEntity` applied in all query hooks — never write `id || _id`.
- **Invalidation**: mutations call `invalidateGroup(qc, id)` and/or `invalidateGlobal(qc)` — don't repeat `invalidateQueries` inline.
- **Demo identity**: selected account is persisted in `tatrasplit_user_handle`; API requests read that key and set `X-User-Handle` (fallback `@misha`).
- **New backend route**: add file in `api/routes/`, register in `main.py`.
- **New page**: add `React.lazy` import in `App.jsx`, wrap element with `<Suspense>`.
- **Loading/empty/error states**: use `<DataState>` component in list pages.
- **No floats** in the money pipeline.
