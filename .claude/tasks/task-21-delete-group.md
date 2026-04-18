# task-21: Delete group

## Status: pending

## Goal
Allow group creator to delete a group. Warn if unsettled balances exist.

## Backend

### Update: `backend/app/api/routes/groups.py`
Add endpoint:
- `DELETE /groups/{group_id}` — delete group (creator only)
  - Check if any non-zero balances exist (call `group_balances()`)
  - If unsettled debts: return 400 with warning (or accept `?force=true` to override)
  - Delete group doc + all related expenses, settlements, activity, recurring (if task-19 done)
  - Log activity before deletion

## Frontend

### UI in GroupDetailPage
Add "Delete group" option:
- In the group header area or in a "..." overflow menu
- Only visible to group creator
- Confirmation dialog: "Delete group '{name}'? This removes all expenses and settlements."
- If unsettled balances: extra warning "There are unsettled debts of €XX.XX"
- On confirm: delete + navigate to `/groups`

### Hook: `frontend/src/hooks/useMutations.js`
- `useDeleteGroup()` — calls `DELETE /groups/{group_id}`
- On success: `invalidateGlobal(qc)` + navigate to groups list

## Files changed
**Backend:** `api/routes/groups.py`
**Frontend:** `pages/GroupDetailPage.jsx`, `hooks/useMutations.js`

## Verification
- Delete button visible only to creator
- Confirmation dialog shows
- With unsettled balances: extra warning displayed
- After delete: redirected to groups list, group gone
- Related expenses/settlements cleaned up in DB
