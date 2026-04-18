# task-18: Make payment / dummy payment

## Status: pending

## Goal
Add a payment flow that simulates sending money to another user. Demo purposes — no real bank integration. Records as a settlement with visual confirmation.

## Frontend

### New page: `frontend/src/pages/PaymentPage.jsx`
- Route: `/payment` (also accessible with query params: `/payment?to=<handle>&amount=<cents>`)
- Steps:
  1. Select recipient — search users or pick from contacts (depends on task-16)
  2. Enter amount — use existing `MoneyInput` component
  3. Add note (optional)
  4. Confirm — shows summary card with "Send €XX.XX to Name"
  5. Processing animation (fake 1-2s delay)
  6. Success screen with checkmark

### Entry points
- Dashboard "Payment" quick action button (already exists in card panel, will need new placement after task-11)
- Settle up page "Mark as paid" → could redirect here with pre-filled amount + recipient
- Direct nav from bottom nav or sidebar

### Hook: `usePayment()` in `hooks/useMutations.js`
- If within a group context: creates settlement via `POST /groups/{id}/settlements`
- If standalone: creates a settlement in a special "Direct Payments" auto-group

## Backend
Existing `POST /groups/{group_id}/settlements` works. No new endpoints needed.

## Files changed
**Frontend:** `pages/PaymentPage.jsx` (new), `App.jsx`, `hooks/useMutations.js`

## Verification
- Payment flow completes with success animation
- Settlement recorded in activity feed
- Balances update after payment
