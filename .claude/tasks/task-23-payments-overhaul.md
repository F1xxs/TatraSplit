# Task 23 — Payments Overhaul (split, group, recurring)

## Goal

Rework the payment system so users can:
1. Create a payment inside a group and **split it** among members
2. Create a standalone payment (outside any group) and split it with selected people
3. Add a payment to an **existing group**
4. Support recurring payments — both standalone and in-group

## Current state

- **PaymentPage** (`pages/PaymentPage.jsx`) — P2P only. Picks a recipient, sends a fixed amount. Under the hood it creates a settlement via `usePayment` (finds/creates a 2-person "Direct Payments" group, posts to `/groups/{id}/settlements`). No split support.
- **SettleUpPage** — uses `useSettle` to post settlements. "Pay in app" redirects to PaymentPage with prefilled params.
- **AddExpenseSheet** (in `GroupDetailPage`) — creates group expenses with split. This is the closest to "payment + split" but it's an expense, not a payment/transfer.
- **Recurring** — exists in-group only (`useGroupRecurring`, backend `routes/recurring.py`, `services/recurring.py`). Creates expenses on schedule. No standalone recurring.
- **Bug**: `AddRecurringSheet` is rendered **twice** in `GroupDetailPage.jsx` (lines 414–428). Remove duplicate.

## What needs to change

### Phase 1 — Group payment with split

- [ ] **PaymentPage**: add "group" selector (optional). When a group is selected, load its members.
- [ ] **Split support in PaymentPage**: add `SplitEditor` component. Let user choose equal/custom split among group members (or selected recipients for standalone).
- [ ] **Backend**: new endpoint or adapt existing. A "payment with split" = an expense where payer pays full amount + wallet debit. Need to decide: is this an expense (affects group balances) or a settlement (wallet transfer)? **Recommendation**: treat as expense (uses existing split infra) + optional wallet debit for "in-app" payments.
- [ ] Wire up invalidation for group expenses/balances after payment.

### Phase 2 — Standalone payment with split (no group)

- [ ] When no group selected, let user search/select multiple recipients.
- [ ] Auto-create a temporary group (or use existing direct-payment group pattern) to hold the split expense.
- [ ] Show split breakdown on confirm screen.

### Phase 3 — Add payment to existing group

- [ ] PaymentPage group selector: dropdown of user's groups (from `useGroups`).
- [ ] When group selected, expense goes into that group. Members auto-populated from group.
- [ ] Entry point: "Add payment" button in GroupDetailPage quick actions (alongside existing "Add expense").

### Phase 4 — Recurring payments (CAREFUL — coworker is working on this)

> **WARNING**: A coworker is actively working on recurring payments. Coordinate before making changes to:
> - `backend/app/api/routes/recurring.py`
> - `backend/app/services/recurring.py`
> - `frontend/src/hooks/useRecurring.js`
> - Recurring tab in `GroupDetailPage`

- [ ] **Standalone recurring**: ability to set up a recurring payment outside a group context (e.g., monthly rent to a specific person). Needs new UI entry point (dashboard or payment page).
- [ ] **Recurring with split**: when creating a recurring payment, allow split configuration (already partially supported — `AddRecurringSheet` has `SplitEditor`).
- [ ] **Review**: ensure recurring processing (`process_due`) correctly handles both group and standalone recurring entries.

### Bugfix (do immediately)

- [ ] Remove duplicate `<AddRecurringSheet>` in `GroupDetailPage.jsx` (lines 414–428, rendered twice).

## Architecture notes

### Payment vs Expense vs Settlement

Current system has three concepts:
- **Expense**: someone paid for something, split among group members. Affects computed `net_cents` in `services/balances.py`.
- **Settlement**: wallet-to-wallet transfer. Deducts `balance_cents` from payer, credits recipient. Also affects computed `net_cents`.
- **Payment** (frontend-only concept in `usePayment`): creates a settlement under the hood.

For "payment with split", the cleanest approach is:
- Create an **expense** in the group (leverages existing split infra)
- Optionally trigger a **wallet debit** if `method: 'in_app'` (banking demo feature)
- This keeps balance calculation in `services/balances.py` correct without special-casing

### Key files to modify

| Area | Files |
|---|---|
| Payment UI | `pages/PaymentPage.jsx` |
| Group detail | `pages/GroupDetailPage.jsx` (bugfix + new action) |
| Mutations | `hooks/useMutations.js` (`usePayment`) |
| Backend expenses | `api/routes/expenses.py` (may need wallet debit option) |
| Backend recurring | `api/routes/recurring.py`, `services/recurring.py` (coordinate with coworker) |
| Hooks | `hooks/useRecurring.js` |

### Dependencies

- Phase 1 is standalone
- Phase 2 depends on Phase 1 (split UI)
- Phase 3 depends on Phase 1 (group selector)
- Phase 4 is independent but requires coordination with coworker

## Out of scope

- Task 22 (fix settle-up behavior: manual vs in-app) — separate task, but related. Settlement endpoint currently always deducts wallet balance even for manual settles.
- Payment method selection (bank transfer, card, etc.) — demo only
