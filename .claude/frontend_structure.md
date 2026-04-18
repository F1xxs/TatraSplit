# Frontend structure and how it works

This document explains the current `frontend/` app as if you are joining the project for the first time.

## 1) Tech stack and core dependencies

The frontend is a **React 19 + Vite 8** single-page app with:

- **react-router-dom** for client-side routing
- **@tanstack/react-query** for server-state fetching/caching
- **axios** for API calls
- **Tailwind CSS v4** (`@tailwindcss/vite`) for styling
- **lucide-react** for icons
- **recharts** for charts (category donut)
- **qrcode.react** for invite QR rendering
- **class-variance-authority + clsx + tailwind-merge** for style composition

Build/lint scripts from `package.json`:

- `npm run dev` (Vite dev server)
- `npm run build`
- `npm run lint`
- `npm run preview`

## 2) High-level folder map

`frontend/src/` is organized by responsibility:

- `main.jsx` — app bootstrap (providers + router)
- `App.jsx` — route definitions
- `components/`
  - `layout/` — shell/navigation (`AppShell`, `BottomNav`)
  - `shared/` — feature-level reusable UI blocks (`GroupCard`, `ExpenseRow`, `SplitEditor`, etc.)
  - `ui/` — low-level design-system primitives (`Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, etc.)
- `hooks/` — all query/mutation hooks (`useGroups`, `useMe`, `useMutations`)
- `lib/` — infrastructure and helpers (`api`, query keys, formatting, mock backend)
- `pages/` — route screens (`DashboardPage`, `GroupDetailPage`, `AddExpensePage`, etc.)
- `index.css` — Tailwind import + theme tokens + base/global styles

## 3) App bootstrap flow (runtime entry)

`src/main.jsx` does:

1. Creates a `QueryClient` with defaults (`retry: 1`, `staleTime: 30s`, no refetch on focus).
2. Wraps app with:
   - `QueryClientProvider`
   - `BrowserRouter`
   - `ToastProvider`
3. Renders `<App />`.

So every page can use React Query hooks, routing, and toasts without extra setup.

## 4) Routing model

`src/App.jsx` defines routes under one shell (`AppShell`):

- `/` → `DashboardPage`
- `/groups` → `GroupsListPage`
- `/groups/new` → `NewGroupPage`
- `/groups/:id` → `GroupDetailPage`
- `/groups/:id/expenses/new` → `AddExpensePage`
- `/groups/:id/settle` → `SettleUpPage`
- `/activity` → `ActivityPage`
- `/join/:token` → `JoinGroupPage`
- unknown routes redirect to `/`

`AppShell` provides persistent layout:

- desktop sidebar + mobile top bar
- bottom nav on mobile
- `<Outlet />` where page content renders

## 5) Data layer and API behavior

### `lib/api.js`

- `API_BASE = VITE_API_BASE || "http://localhost:8000/api/v1"`
- `VITE_USE_MOCK !== "false"` means **mock mode is ON by default**
- `api.get` / `api.post` call:
  - mock handler (`lib/mock.js`) when mock mode is on
  - axios instance when mock mode is off

Axios response interceptor normalizes backend errors to `Error(message)` from:
- `response.data.detail`
- `response.data.message`
- fallback axios message

### `lib/mock.js` (important for local understanding)

This is a deterministic in-memory fake backend:

- stores users/groups/expenses/settlements/activity in JS arrays
- calculates balances + simplified transfers
- supports join links and activity feed
- simulates latency (`~220-400ms`)

So the frontend is currently usable even if backend is unavailable.

## 6) React Query strategy

### Query keys (`lib/queryKeys.js`)

Centralized key factory:
- `['me']`, `['groups']`, `['group', id]`, `['group', id, 'expenses']`, etc.

### Read hooks (`hooks/useMe.js`, `hooks/useGroups.js`)

All data fetching goes through hooks:
- `useMe`, `useMeBalances`
- `useGroups`, `useGroup`
- `useGroupExpenses`, `useGroupBalances`, `useGroupActivity`
- `useActivity`, `useUsers`

### Mutation hooks (`hooks/useMutations.js`)

Mutations:
- create group
- add expense
- settle payment
- join group

Each mutation invalidates related queries so UI refreshes everywhere:
- group detail
- balances
- activity
- groups list
- me balances

This is the main consistency mechanism in the app.

## 7) UI architecture and component boundaries

### `components/ui/`

Primitive components (Button, Card, Input, Tabs, Dialog, Sheet, etc.) are custom wrappers, not Radix imports.  
They share design tokens via CSS variables and `cn()` utility (`clsx + tailwind-merge`).

### `components/shared/`

Feature UI pieces composed from primitives:

- `GroupCard` — list card with group net status
- `ExpenseRow` — expense item with user impact
- `ActivityItem` / `BankTransactionRow` — timeline rows
- `CategoryDonut` — Recharts pie + legend
- `SplitEditor` — equal/custom split editor with validation remainder
- `QRInviteDialog` — invite QR + copy/share logic
- `MoneyInput` — cents-based numeric input formatting

### `components/layout/`

- `AppShell` manages page frame + navigation
- `BottomNav` is mobile bottom action bar

## 8) Pages and what each screen owns

- `DashboardPage`: account card, quick actions, short groups list, recent activity
- `GroupsListPage`: all groups
- `GroupDetailPage`: tabs for expenses/balances/activity + invite + add-expense sheet
- `AddExpensePage`: right-side sheet + amount/category/payer/split editor
- `SettleUpPage`: simplified transfer list + "mark paid"
- `NewGroupPage`: group creation form (name/emoji/currency/members)
- `JoinGroupPage`: auto-join by invite token (supports `?as=@handle` in flow)
- `ActivityPage`: account-transaction style feed

## 9) Money and domain handling

The frontend consistently handles values as **integer cents**:

- display conversion is done via `formatMoney(cents, currency)`
- split logic uses cents and deterministic remainder distribution
- custom split validates exact sum vs total amount

This avoids floating-point drift and matches backend contract.

## 10) Styling and theming

`src/index.css`:

- imports Tailwind (`@import "tailwindcss"`)
- defines theme tokens in `@theme` (dark palette, semantic colors)
- sets base styles for body/root/scrollbars/animations
- includes animation keyframes used by toasts/dialog/sheet/skeleton

`App.css` is intentionally unused (placeholder note only).

## 11) Coupling to backend API

The shared API contract was extracted to:

- `/.claude/api.md`

Use that file as the single source of truth for endpoints used by both frontend and backend.

## 12) Mental model for a new developer

If you are changing behavior, usually touch in this order:

1. **API contract / helper** in `lib/api.js` or backend response shape
2. **Query key + hook** in `hooks/`
3. **Page-level orchestration** in `pages/`
4. **Reusable rendering** in `components/shared/`
5. **Primitive style** in `components/ui/` or `index.css`

This keeps data flow clear: backend/mock -> hook -> page -> shared/UI component.
