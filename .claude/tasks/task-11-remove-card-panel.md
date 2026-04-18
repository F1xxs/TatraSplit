# task-11: Remove card panel from Dashboard

## Status: pending

## Goal
Remove the redundant account card carousel from `DashboardPage.jsx`. It mimics a bank card UI but adds no split-payment value and clutters the dashboard.

## What to remove
**File:** `frontend/src/pages/DashboardPage.jsx`

- Line 25: `const [cardIdx, setCardIdx] = useState(0)` — carousel state
- Lines 40-43: `const cards = [...]` array
- Lines 51-168: entire "Accounts" section JSX block (card carousel, prev/next buttons, dot tabs, action buttons: Share IBAN, Request payment, Transactions, Payment, ATM, Standing)

## Decision on balance display
The TatraSplit account balance (€535.11) and IBAN live inside the card. Two options:
1. **Remove entirely** — dashboard shows groups + recent transactions only (recommended for hackathon)
2. **Keep a slim balance header** — replace carousel with a single-line `useMeBalances()` summary row

Default: remove entirely unless reviewer decides otherwise.

## What to keep
- "Shared payments" section (groups list)
- "Recent transactions" section (activity feed)

## Files changed
- `frontend/src/pages/DashboardPage.jsx`

## Verification
- Dashboard loads without errors
- No blank space where card was
- Groups and recent transactions still render
