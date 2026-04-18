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
  - `ui/` — low-level design-system primitives (`Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Avatar`, `Badge`, `Input`, `Label`, `Separator`, `Skeleton`, `Toaster`, etc.)
- `hooks/` — all query/mutation hooks (`useGroups`, `useMe`, `useMutations`, `useRecurring`)
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
- `/payment` → `PaymentPage`
- `/admin` → `AdminPage`
- `/join/:token` → `JoinGroupPage`
- unknown routes redirect to `/`

`AppShell` provides persistent layout:

- desktop sidebar + mobile top bar
- bottom nav on mobile
- `<Outlet />` where page content renders

All page components are loaded via `React.lazy` + `Suspense` in `App.jsx`. Each route element is wrapped with `<Suspense fallback={<PageFallback />}>`. This splits the bundle per-route. When adding new pages, follow the same `lazy(() => import(...).then(m => ({ default: m.PageName })))` pattern.

## 5) Data layer and API behavior

### `lib/normalize.js`

Normalizes MongoDB `_id` → stable `id` field on entity objects. Applied at query boundary so UI code always uses `entity.id`.

- `normalizeEntity(doc)` — top-level `_id` → `id` (string), strips `_id` key
- `normalizeList(docs)` — maps `normalizeEntity` over arrays
- `normalizeGroup(g)` — normalizes group + nested `members[]`

Applied in all `queryFn` implementations. Mutation fns for `useCreateGroup` and `useJoinGroup` also normalize their responses.

**Rule:** Never write `entity.id || entity._id` — always `entity.id`. If a new hook is added, apply `normalizeEntity` / `normalizeGroup` / `normalizeList` in its `queryFn`.

### `lib/invalidation.js`

Centralized React Query invalidation helpers used by all mutations:

- `invalidateGlobal(qc)` — invalidates `me`, `groups`, `meBalances`, `activity`, `users`
- `invalidateGroup(qc, id)` — invalidates `group`, `groupExpenses`, `groupBalances`, `groupActivity`, `groupSettlements` for a specific group

**Rule:** All mutations must call these helpers in `onSuccess` instead of repeating `invalidateQueries` calls inline.

### `lib/api.js`

- `API_BASE = VITE_API_BASE || "http://localhost:8000/api/v1"`
- `VITE_USE_MOCK !== "false"` means **mock mode is ON by default**
- Request interceptor reads `localStorage.getItem("tatrasplit_user_handle")` and sets `X-User-Handle` on every request (fallback `@misha`)
- `api.get` / `api.post` call:
  - mock handler (`lib/mock.js`) when mock mode is on
  - axios instance when mock mode is off

Axios response interceptor normalizes backend errors to `Error(message)` from:
- `response.data.detail`
- `response.data.message`
- fallback axios message

### `lib/utils.js`

Exports `cn(...inputs)` — combines `clsx` and `tailwind-merge` for conditional, conflict-free Tailwind class composition. Used by every UI primitive and shared component.

### `lib/mock.js` (important for local understanding)

This is a deterministic in-memory fake backend:

- stores users/groups/expenses/settlements/activity in JS arrays
- calculates balances + simplified transfers
- supports join links and activity feed
- supports `DELETE /groups/:id` with creator-only + unsettled-balance guard + cascading cleanup
- simulates latency (`~220-400ms`)

So the frontend is currently usable even if backend is unavailable.

## 6) React Query strategy

### Query keys (`lib/queryKeys.js`)

Centralized key factory:
- `['me']`, `['groups']`, `['group', id]`, `['group', id, 'expenses']`, `['group', id, 'settlements']`, `['group', id, 'recurring']`, etc.

### Read hooks (`hooks/useMe.js`, `hooks/useGroups.js`)

All data fetching goes through hooks:
- `useMe`, `useMeBalances`
- `useGroups`, `useGroup`
- `useGroupExpenses`, `useGroupBalances`, `useGroupActivity`, `useGroupSettlements`
- `useActivity`, `useUsers`
- `useGroupRecurring` (from `useRecurring.js`)

### Mutation hooks (`hooks/useMutations.js`)

Mutations:
- create group
- delete group
- add expense
- settle payment
- join group
- make payment (`usePayment` — finds/creates direct group, then posts settlement)
- create/delete recurring (`useCreateRecurring`, `useDeleteRecurring` from `useRecurring.js`)
- process recurring (`useProcessRecurring` from `useRecurring.js`)

Each mutation calls `invalidateGroup` and/or `invalidateGlobal` from `lib/invalidation.js`. Invalidation rules are defined in one place — don't duplicate `invalidateQueries` calls inline.

Each mutation invalidates related queries so UI refreshes everywhere:
- group detail
- balances
- activity
- groups list
- me balances

This is the main consistency mechanism in the app.

## 7) UI architecture and component boundaries

### `components/ui/`

Primitive components are custom wrappers (not Radix imports). They share design tokens via CSS variables and `cn()` from `lib/utils.js`.

Current primitives: `button`, `card`, `dialog`, `sheet`, `tabs`, `avatar`, `badge`, `input`, `label`, `separator`, `skeleton`, `toaster`.

### `components/shared/`

Feature UI pieces composed from primitives:

- `GroupCard` — list card with group net status
- `ExpenseRow` — expense item with user impact
- `ActivityItem` — timeline rows
- `CategoryDonut` — Recharts pie + legend
- `CategoryIcon` — emoji icon with tinted background for a given expense category
- `BalancePill` — colored badge (green/red/neutral) showing a signed money amount in cents
- `SplitDonut` — Recharts donut + per-participant breakdown; uses `share_cents` from split array
- `SplitEditor` — equal/custom split editor with validation remainder
- `QRInviteDialog` — invite QR + copy/share logic
- `MoneyInput` — cents-based numeric input formatting
- `DataState` — unified loading/empty/error state wrapper

**`DataState` usage pattern:**
```jsx
<DataState loading={isLoading} error={error} empty={items.length === 0}
           emptyMessage="Nothing yet." onRetry={refetch} loadingRows={3}>
  <List ... />
</DataState>
```
Use `emptyContent` prop for custom empty states with links/actions. Used in Dashboard, GroupsListPage, GroupDetailPage, ActivityPage.

### `components/layout/`

- `AppShell` manages page frame + navigation, and includes demo account switcher in the desktop sidebar user block (`@misha`, `@lukas`, `@nina`, `@tomas`)
- `BottomNav` is mobile bottom action bar
- `TatraMark` — SVG logo mark (Tatra banka diagonal bars); accepts `className` for sizing/coloring

Account switch flow:
- Selecting an account in `AppShell` stores handle in `localStorage` key `tatrasplit_user_handle`
- `invalidateGlobal(qc)` is triggered so `qk.me` and related global queries refresh immediately
- `useMe()` then reflects the switched identity without reload

## 8) Pages and what each screen owns

- `DashboardPage`: account card, quick actions, short groups list, recent activity
- `GroupsListPage`: all groups
- `GroupDetailPage`: tabs for expenses/balances/activity + invite + add-expense sheet + creator-only delete action with confirmation/unsettled warning; successful delete redirects to `/groups`
- `AddExpensePage`: right-side sheet + amount/category/payer/split editor
- `SettleUpPage`: simplified transfer list + "mark paid"
- `NewGroupPage`: group creation form (name/emoji/currency/members)
- `JoinGroupPage`: auto-join by invite token (supports `?as=@handle` in flow)
- `PaymentPage`: P2P payment form (recipient search, amount, confirm, processing animation, success)
- `AdminPage`: DB management panel (reset, seed, collection status)
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
