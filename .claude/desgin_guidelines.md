# TatraSplit — Design Guidelines (current frontend implementation)

Derived from the current code in `frontend/src/` and intended as the practical style source of truth.

---

## 1. Design tokens (from `src/index.css`)

### Color system

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `hsl(0 0% 0%)` | App/page background (pure black) |
| `--color-foreground` | `hsl(0 0% 98%)` | Primary text |
| `--color-card` | `hsl(0 0% 9%)` | Cards and list containers |
| `--color-card-elevated` | `hsl(0 0% 9%)` | Elevated surfaces (same tone currently) |
| `--color-primary` | `hsl(210 90% 62%)` | Primary actions/active nav/focus accents |
| `--color-muted-foreground` | `hsl(240 5% 65%)` | Secondary labels/subtitles |
| `--color-destructive` | `hsl(0 75% 62%)` | Destructive actions/errors |
| `--color-success` | `hsl(142 72% 55%)` | Positive money/success states |
| `--color-warning` | `hsl(38 92% 60%)` | Warning states |
| `--color-info` | `hsl(199 89% 65%)` | Informational states |
| `--color-border` | `hsl(0 0% 9%)` | Borders/dividers |

### Chart palette

Use `--color-chart-1` … `--color-chart-6` for category/charts before introducing new custom colors.

### Radius & typography

- Base radius: `--radius: 0.875rem` (~14px)
- Typical card radius in UI: `rounded-2xl` (16px)
- Font family: `Inter, ui-sans-serif, system-ui, ...`

---

## 2. Layout system

### Shell behavior

- **Desktop (`lg+`)**: left sidebar + content column.
- **Mobile**: sticky top bar + fixed bottom nav.
- Main content max width: `max-w-3xl` (`lg:max-w-4xl`).
- Bottom safe-area padding is required to avoid overlap with bottom navigation.

### Navigation pattern

- Desktop nav labels: `Home`, `Transactions`, `Shared payments`.
- Mobile bottom nav has 5 slots: `Home`, `Transactions`, center `Payment`, `Offers`, `More`.
- Active nav color: `var(--color-primary)`.
- Inactive nav color: `var(--color-muted-foreground)`.

---

## 3. Components and visual patterns

### Cards

- Base card class pattern:
  - `rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]`
- Elevated cards add shadow:
  - `shadow-xl shadow-black/30`
- Inner padding standard: `p-5`.

### Buttons

- Use `components/ui/button.jsx` variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `link`.
- Primary buttons use subtle blue glow (`shadow-[var(--color-primary)]/20`).
- Press feedback: `active:scale-[0.98]`.

### Rows (activity/expense/group)

- Row layout: leading icon/avatar (40px), title+subtitle, right-aligned amount/meta.
- Row paddings are generally `px-4 py-3.5`.
- Dividers are full-width border lines via `border-[var(--color-border)]`.

### Avatars

- Prefer `Avatar`/`AvatarStack` from `components/ui/avatar.jsx`.
- User color comes from `user.color`; fallback is deterministic hash color (`colorForName`).

### Toasts/dialogs/sheets

- Custom implementation (not Radix imports), rendered via portal.
- Dark overlay with blur and hand-rolled animations (`fade-in`, `slide-in-from-right`, `slide-in-from-bottom`, `scale-in`).

---

## 4. Money formatting and financial semantics

- Store and pass amounts as **integer cents**.
- Format through `formatMoney(cents, currency)` in `src/lib/format.js`.
- Current formatter uses `Intl.NumberFormat('en-IE', { style: 'currency' })`.
- Color semantics:
  - debit/outgoing: red (`#E84040` or destructive token)
  - credit/incoming: green (`#1DB954` or success token)
- Use tabular numbers for aligned amounts (`tabular-nums`).

---

## 5. Page-level style guidance

### Dashboard (`/`)

- Sections: Accounts, Quick actions, Shared payments, Recent transactions.
- Account card is the hero surface.
- Quick actions are icon-first rounded tiles.

### Group detail (`/groups/:id`)

- Header card with group emoji, title, member avatars, and user balance.
- Action row: Add expense, Settle up, Invite, Members.
- Tabs: Expenses / Balances / Activity.

### Add expense

- Implemented as right-side sheet (`Sheet`), not a full route-only form.
- Amount input uses oversized centered numeric style.
- Category uses rounded chips; split editor supports Equal/Custom.

### Settle up

- Transfer rows: from user -> to user, amount, `Mark paid` action.
- Empty terminal state: “All settled up”.

---

## 6. Icons and labels

- Icon source: `lucide-react`.
- Common icon sizes: `h-4 w-4`, `h-5 w-5`.
- Use text labels with icons for navigation and key actions.
- Icon-only buttons must have `aria-label`.

---

## 7. Motion and interaction rules

- Respect existing keyframes from `index.css`; reuse rather than adding one-off animation names.
- Keep transitions subtle and fast (`~180–260ms` in current components).
- Preserve safe-area behavior on mobile bottom-fixed components.

---

## 8. Consistency rules for future UI changes

1. Reuse theme tokens (`var(--color-*)`) instead of hardcoded colors whenever possible.
2. Reuse `ui/` primitives before introducing new base components.
3. Keep dark-first contrast and avoid introducing light surfaces.
4. Keep monetary UX cents-safe end to end.
5. Prefer existing spacing/radius rhythm (`px-4`, `py-3.5`, `p-5`, `rounded-2xl`).
6. Avoid mixing locale formats in one screen; use shared format helpers.
