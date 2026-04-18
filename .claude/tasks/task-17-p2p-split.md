# task-17: Split payment with contact (P2P)

## Status: pending

## Depends on: task-16 (contacts)

## Goal
Allow splitting a payment directly with a contact without creating a group first. Creates a temporary 2-person group behind the scenes or uses a direct debt model.

## Approach: auto-group
Simplest approach — when user splits with a contact:
1. Check if a 2-person group already exists between them
2. If yes, add expense to that group
3. If no, auto-create a group named "{User} & {Contact}" and add expense

This reuses all existing expense/balance/settlement infrastructure.

## Frontend

### Entry points
- ContactsPage: "Split" button per contact → opens AddExpense flow with contact pre-selected
- ActivityPage (task-12): split button on payment row → pick contact → same flow

### Flow
1. User taps "Split" on a contact
2. Opens AddExpense sheet/page with contact pre-selected as only split member
3. User enters amount and description
4. Submit creates auto-group (if needed) + expense

### New hook: `frontend/src/hooks/useMutations.js`
Add `useP2PSplit()` mutation:
- Checks for existing 2-person group
- Creates group if missing
- Adds expense
- Returns group ID for navigation

## Backend
No new endpoints needed — uses existing `POST /groups` + `POST /groups/{id}/expenses`.

## Files changed
**Frontend:** `hooks/useMutations.js`, `pages/ContactsPage.jsx`, `components/shared/ActivityItem.jsx`

## Verification
- Split with contact creates expense
- Second split with same contact reuses group
- Balances update correctly
- Settlement flow works for P2P group
