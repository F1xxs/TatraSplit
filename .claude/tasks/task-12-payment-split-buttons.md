# task-12: Split buttons on individual payment rows

## Status: pending

## Goal
Add a "Split" action button to each payment row in the activity/transactions feed so users can quickly split a bank transaction with group members.

## Where rows are rendered
- **Component:** `frontend/src/components/shared/ActivityItem.jsx` — `BankTransactionRow` function (lines 84-133)
- **Used in:**
  - `frontend/src/pages/ActivityPage.jsx` (line 50-57)
  - `frontend/src/pages/DashboardPage.jsx` (line 239) — recent transactions section

## What to build
1. Add a small "Split" icon button (scissors or split icon) to the right side of each `BankTransactionRow`
2. On click: navigate to `/groups` with pre-filled query params `?title=<title>&amount_cents=<amount>` OR open the `AddExpense` sheet/dialog with those values pre-populated
3. Only show for debit transactions (negative amount) — no split button on credits/income rows

## Data available in each row
- `item.title` / derived from `getTitle(item)` — expense name
- `item.amount` / amount field — already in cents in the mock data
- `item.type` — can filter by type

## Key files
- `frontend/src/components/shared/ActivityItem.jsx` — add button to `BankTransactionRow`
- `frontend/src/pages/AddExpensePage.jsx` — check if it accepts query param pre-fill
- `frontend/src/hooks/useMutations.js` — `useAddExpense` mutation

## Verification
- Split button appears on debit rows, not on credit rows
- Clicking button opens AddExpense with title + amount pre-filled
- Adding expense from split flow works end-to-end
