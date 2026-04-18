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

### Folders

```
src/
  main.jsx                   (wrap QueryClientProvider, BrowserRouter, <Toaster/>)
  App.jsx                    (route tree + <AppShell>)
  index.css                  (Tailwind directives + shadcn CSS vars, dark default)
  lib/       api.js, queryKeys.js, format.js, utils.js
  hooks/     useMe, useGroups, useGroup, useActivity, useMutations
  components/
    ui/                                  (shadcn-generated)
    layout/    AppShell.jsx, BottomNav.jsx
    shared/    BalancePill, MemberAvatar, AvatarStack, CategoryIcon,
               ExpenseRow, GroupCard, QRInviteDialog, CategoryDonut,
               ActivityItem, MoneyInput, SplitEditor
  pages/     DashboardPage, GroupsListPage, GroupDetailPage,
             AddExpensePage, SettleUpPage, ActivityPage,
             JoinGroupPage, NewGroupPage
```

### Routes

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Cross-group "you owe / owed to you", category donut, group list, recent activity |
| `/groups` | GroupsList | Full list (dashboard shows top few) |
| `/groups/new` | NewGroup | Create: name, emoji, currency, member picker |
| `/groups/:id` | GroupDetail | Tabs: Expenses / Balances / Activity + Invite + Settle buttons |
| `/groups/:id/expenses/new` | AddExpense | Amount → desc → category → payer → split (equal/custom) |
| `/groups/:id/settle` | SettleUp | Simplified transfer list, "Mark paid" → POST settlement |
| `/activity` | ActivityPage | Global feed |
| `/join/:token` | JoinGroup | Auto-joins via invite token (supports `?as=@handle` for demo) |

### Key flows

**Create & invite** — `POST /groups` → redirect to detail → "Invite" button opens `QRInviteDialog` rendering a `qrcode.react` of `window.location.origin + "/join/" + token` with copy-link.

**Add expense** — big `MoneyInput`, category chips (`ToggleGroup`), payer avatars, `SplitEditor` (Equal/Custom tabs with live remainder bar). Submit invalidates group + balances.

**Settle up** — reads `simplified_transfers` from `/groups/:id/balances`; each row is "Misha → Lukas €12.50 [Mark paid]". Optimistic removal + `POST /settlements`. Empty state when done.

## Build order (24h)

| Hour | Milestone |
|---|---|
| 0–1 | Deps + scaffolding. Tailwind + shadcn init. Router + AppShell. Dark theme tokens. Backend motor wiring + Atlas ping. |
| 1–3 | Backend: users/groups models + routes + invite token. Seed script (Misha + 3 friends + 2 groups + expenses). |
| 3–5 | Backend: expenses + settlements + balances aggregation + simplification. Verify via Swagger. |
| 5–7 | Frontend dashboard wired to real data (`/users/me`, `/me/balances`, groups list). BalancePill, GroupCard, CategoryDonut. |
| 7–9 | Group detail + Expenses tab + Add-expense Sheet. Query invalidation. **This is the screenshot-worthy milestone.** |
| 9–11 | Balances tab + SettleUp page + optimistic mark-paid. |
| 11–13 | QR invite dialog + JoinGroupPage. Activity writes from backend on each mutation + activity feed. |
| 13–15 | Category chips + donut on dashboard and group detail. Category filter on expense list. |
| 15–17 | Polish: skeletons, empty states, toasts, money/time formatting, dark theme tuning, bottom nav on mobile. |
| 17–19 | Stretch: `?as=` demo-switching on JoinGroup, confetti on fully settled, small balance-change animations. |
| 19–21 | Demo prep: seed reset, dress rehearsal, "Powered by MongoDB Atlas" footer chip, crash-fix. |
| 21–24 | Buffer. |

**Cut order if slipping**: custom split editor → per-group donut → mobile bottom nav → activity page UI (keep data) → QR page (keep shareable link text).

## Critical files to create

Backend: [backend/app/main.py](backend/app/main.py), [backend/app/core/{config,db,security}.py](backend/app/core/), [backend/app/api/deps.py](backend/app/api/deps.py), [backend/app/api/routes/{users,groups,expenses,settlements,balances,activity}.py](backend/app/api/routes/), [backend/app/models/{common,user,group,expense,settlement,activity,balance}.py](backend/app/models/), [backend/app/services/{balances,simplify,activity,seed}.py](backend/app/services/), [backend/requirements.txt](backend/requirements.txt), [backend/.env.example](backend/.env.example).

Frontend: [frontend/package.json](frontend/package.json), [frontend/vite.config.js](frontend/vite.config.js), `frontend/tailwind.config.js` (new), `frontend/postcss.config.js` (new), `frontend/components.json` (new), [frontend/src/index.css](frontend/src/index.css), [frontend/src/main.jsx](frontend/src/main.jsx), [frontend/src/App.jsx](frontend/src/App.jsx), plus all files under `src/{lib,hooks,components,pages}`.

## Verification (end-to-end)

`backend/.env`:
```
APP_NAME=TatraSplit API
DEBUG=true
API_PREFIX=/api/v1
MONGO_URI=mongodb+srv://<user>:<pw>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=tatra_split
CURRENT_USER_HANDLE=@misha
```

Run:
```bash
# Backend
cd backend && source .venv/bin/activate
pip install -r requirements.txt
python -m app.services.seed --reset
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
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

- **shadcn + Tailwind init can eat 2h** — do it first, follow docs literally, commit as soon as a button renders.
- **Atlas flakiness at demo time** — whitelist `0.0.0.0/0`, consider a local `mongod` fallback via env swap.
- **Rounding on equal splits** (€10/3 = 333/333/334) — deterministic remainder distribution in the service.
- **QR "join" feels fake with one real user** — the `?as=@handle` query-param on JoinGroup lets you live-demo joining as Lukas/Nina.
- **Debt simplification edge cases** (all-zero balances) — guard `abs(net) < 1`; sanity-check with seed before demo.
- **Custom split UX is a rabbit hole** — ship equal-only first, add custom only after SettleUp is end-to-end.
