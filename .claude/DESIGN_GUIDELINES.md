# TatraSplit — Design Guidelines

Derived from: TatraBank app screenshots (visual language) + Monobank (sharing UX patterns).

---

## 1. Visual Language (TatraBank-faithful)

### Color palette

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#0D0D12` | Page / screen background |
| `bg-card` | `#1A1A22` | Cards, list rows, modals |
| `bg-card-raised` | `#242430` | Active/hover card state, inputs |
| `accent-blue` | `#0070D2` | Primary CTA, links, icons, active nav tab |
| `accent-blue-dim` | `#0055A0` | Pressed state |
| `amount-debit` | `#E84040` | Negative amounts (money out) |
| `amount-credit` | `#1DB954` | Positive amounts (money in) |
| `text-primary` | `#FFFFFF` | Headings, amounts |
| `text-secondary` | `#9CA3AF` | Labels, subtitles, dates |
| `text-muted` | `#4B5563` | Placeholder, disabled |
| `divider` | `#2A2A35` | Row separators |
| `danger` | `#E84040` | Destructive actions |

### Typography

- Font: system-ui stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`)
- Balance / hero amount: `32–40px`, `font-weight: 700`, `text-primary`
- Section heading: `18px`, `font-weight: 600`, `text-primary`
- List item title: `15px`, `font-weight: 500`, `text-primary`
- List item subtitle: `13px`, `font-weight: 400`, `text-secondary`
- Amount in list: `15px`, `font-weight: 600`, color per debit/credit
- Labels / captions: `12px`, `text-muted`

### Shape & spacing

- Card border-radius: `16px`
- Quick-action icon button: `56×56px`, `border-radius: 14px`, `bg-card-raised`
- List row padding: `16px` horizontal, `14px` vertical
- Section gap: `24px`
- Inner card padding: `20px`

### Icons

- Style: outlined, 24px, stroke `1.5px`
- Color: `accent-blue` for active/interactive, `text-secondary` for passive
- Tatra "///" slash mark: use as logo / loading indicator only

---

## 2. Component Patterns

### Bottom navigation

5 tabs: Home · Transactions · Payment · Groups · More  
Active tab: `accent-blue` icon + label. Inactive: `text-muted`.  
No border — just `bg-card` bar with safe-area padding.

### Quick-action grid

Row of 3–4 icon buttons below balance card.  
Each: rounded-square `bg-card-raised`, icon above, label `12px text-secondary` below.  
Tap: scale-down `0.95` + background darken.

### Cards

```
bg-card  rounded-2xl  p-5
├── title (text-secondary, 12px caps)
├── main value (text-primary, bold, large)
└── secondary info (text-secondary, 13px)
```

### List rows (transactions / expenses)

```
[avatar/icon 40px]  [title + subtitle]  [amount right-aligned]
                                         amount: debit=red, credit=green
```
Separator: `divider` 1px, inset 56px left (aligns after avatar).

### Amount display

- Always use `toLocaleString('sk-SK')` comma decimal format: `1 563,34 EUR`
- Debit prefix: `−` (minus). Credit: no prefix or `+`.
- Currency suffix, slightly smaller font, `text-secondary`.

---

## 3. Sharing / Split UX (Monobank-inspired)

### Entry points (where user can initiate split)

1. **Transaction row** — if expense has no split yet, show pill badge `Rozdeliť účet` (Split bill) in green below transaction title. Tapping opens Split Sheet.
2. **Transaction detail** — action list item "Rozdeliť výdavok" with split icon, first in action list.
3. **Groups tab** — "Add expense" primary action button.

### Split donut visualization

Used on: group expense detail, shared payment status screen.

```
         [Avatar pin at top = payer]
        ╭──────────────────╮
       ╱   donut ring        ╲
      │   [category icon]    │
      │   Description        │
      │   2 296,53 EUR       │
       ╲                    ╱
        ╰──────────────────╯
         [Avatar pin = participant]
```

- Ring segments: each participant gets arc proportional to their share
- Segment colors: use each user's `color` field from DB
- Avatar pins: `36px` circle avatar at arc midpoint
- Center: category emoji/icon, expense description, total amount
- Below ring: participant list — avatar + name + amount per row

### Shared payment request flow

1. User taps "Split" on transaction or expense
2. **Split Sheet** slides up:
   - Expense info header (merchant, amount)
   - Participant selector (search + add from contacts/group)
   - Split mode toggle: Equal | Custom
   - Per-person amount preview
   - "Send request" CTA (`accent-blue`, full-width)
3. After send: transaction row gets `Rozdeliť účet` replaced with status pill: `Čaká sa` (Pending) or `Zaplatené` (Paid)
4. Recipient sees notification → opens shared payment detail with donut ring

### Pending request states

| State | Pill color | Label |
|---|---|---|
| Waiting | amber `#F59E0B` | Čaká sa |
| Paid | green `#1DB954` | Zaplatené |
| Declined | red `#E84040` | Odmietnuté |

### Settlement action list (bottom sheet)

After opening a split request, show action list:
- Edit request (pencil icon)
- Send reminder (bell icon)  
- Delete request (trash icon, `danger` color)

---

## 4. Screen-by-screen guidance

### Dashboard (`/`)

- Top: greeting + avatar (no logo clutter)
- Hero balance card: total owed / total you owe across all groups
- Quick actions row: `Add Expense` · `Settle Up` · `New Group` · `Scan QR`
- Section: "Your groups" — horizontal scroll cards with group emoji + name + net balance pill
- Section: "Recent activity" — transaction-style list rows

### Group detail (`/groups/:id`)

- Header: group emoji (large) + name + member avatars overlapping row
- Balance card: your net in this group
- Tabs: Expenses | Balances | Activity
- **Expenses tab**: transaction-list style, newest first, with Split pill on unsplit items
- **Balances tab**: simplified transfer list — "You → Person: X EUR" rows with Settle button
- FAB: `+` Add expense (bottom-right, `accent-blue` circle)

### Add expense (`/groups/:id/expenses/new`)

- Full-screen sheet
- Amount input: large centered numpad-style
- Fields: description, category picker (emoji grid), date
- Split section: participant chips with amounts (Equal default, toggle Custom)
- "Add" CTA: full-width `accent-blue`

### Settle up (`/groups/:id/settle`)

- List of simplified transfers
- Each row: from-avatar → to-avatar arrow, amount, "Mark as paid" button
- Paid rows: strikethrough + green checkmark

---

## 5. Motion & interaction

- Page transitions: slide-in from right (standard push)
- Sheet open: slide up from bottom, `300ms ease-out`
- Amount change: number morphs with `tabular-nums` (no jump layout)
- Pull-to-refresh: native feel, spinner in `accent-blue`
- Haptic: light impact on CTA tap, success notification on settle

---

## 6. Accessibility

- Minimum touch target: `44×44px`
- Amount contrast: red/green on dark — verify WCAG AA (4.5:1) — may need lighter shades on dark bg
- All icons paired with text label or `aria-label`
- Focus ring: `2px solid accent-blue` offset `2px`
