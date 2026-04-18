# task-22: Fix settle-up behavior (in-app repay vs off-app manual settle)

## Status: pending

## Goal
Make settle-up actions clear and correct for two separate flows:
1. Person paid you back through the app (create real settlement payment).
2. Person paid you back outside the app (record manual/off-app settlement).

Current behavior is confusing and requires manual marking in a strange way.

## Backend

### Review and clarify settlement semantics
- Ensure `POST /groups/{group_id}/settlements` supports explicit settlement type/source:
  - `in_app` (payment done in app)
  - `off_app` (external payment, only record in ledger)
- Validate request shape and keep money fields in integer cents.
- Keep activity feed entries distinguishable (e.g., "settled in app" vs "settled off app").

### Balance impact
- Both flows must reduce debt consistently in balances.
- Prevent double settlement for the same amount/person pair when user taps repeatedly.

## Frontend

### Settle up UI (`frontend/src/pages/SettleUpPage.jsx`)
- Present two explicit actions for each payable row:
  - "Paid in app"
  - "Mark paid outside app"
- Use clear copy so user understands both options.
- Add confirmation text specific to selected flow.

### Mutation layer (`frontend/src/hooks/useMutations.js`)
- Extend `useSettle` to pass settlement source/type.
- Keep existing invalidation pattern (`invalidateGroup` / `invalidateGlobal`).

### Activity / labels
- Update activity item rendering if needed so users can see how settlement was recorded.

## Files changed
**Backend:** `api/routes/settlements.py`, related settlement models/services
**Frontend:** `pages/SettleUpPage.jsx`, `hooks/useMutations.js`, possibly `components/shared/ActivityItem.jsx`

## Verification
- Settling via "Paid in app" updates balances correctly and logs in-app settlement activity.
- Settling via "Mark paid outside app" updates balances correctly and logs off-app activity.
- User does not need manual workaround marking.
- Repeated taps do not create accidental duplicate settlements.
