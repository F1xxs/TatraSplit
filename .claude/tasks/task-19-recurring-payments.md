# task-19: Recurring payments + split recurring

## Status: pending

## Goal
Allow users to create recurring expenses (rent, utilities, subscriptions) that auto-generate expenses on a schedule. Support splitting recurring expenses with group members.

## Backend

### New collection: `recurring`
```
{
  _id,
  group_id,
  title,
  amount_cents,
  currency,
  category,
  paid_by,
  split_type: "equal" | "custom",
  custom_split: [{ user_id, share_cents }],
  frequency: "weekly" | "biweekly" | "monthly",
  next_due: datetime,
  active: bool,
  created_by,
  created_at
}
```
Index: `(group_id, active, next_due)`

### New file: `backend/app/api/routes/recurring.py`
- `GET /groups/{group_id}/recurring` — list recurring expenses for group
- `POST /groups/{group_id}/recurring` — create recurring expense
- `DELETE /groups/{group_id}/recurring/{id}` — deactivate recurring expense
- `POST /admin/process-recurring` — manually trigger due recurring expenses (for demo, since no real cron)

### Processing logic: `backend/app/services/recurring.py`
`async def process_due(db)`:
- Find all `recurring` docs where `active=True` and `next_due <= now`
- For each: create expense via same logic as manual expense creation
- Advance `next_due` by frequency interval
- Log activity

## Frontend

### UI in GroupDetailPage
- New tab or section: "Recurring" alongside Expenses/Balances/Activity
- List of recurring expenses with frequency badge, next due date, amount
- "Add recurring" button → AddExpense-like form with frequency picker
- "Pause" / "Delete" actions per recurring item

### New hook: `frontend/src/hooks/useRecurring.js`
- `useGroupRecurring(groupId)`
- `useCreateRecurring()`
- `useDeleteRecurring()`

## Files changed
**Backend:** `api/routes/recurring.py` (new), `services/recurring.py` (new), `main.py`, `core/db.py` (add index)
**Frontend:** `hooks/useRecurring.js` (new), `pages/GroupDetailPage.jsx`, `App.jsx`

## Verification
- Create recurring expense with monthly frequency
- Trigger `POST /admin/process-recurring` — new expense appears in group
- next_due advances correctly
- Recurring list shows active items with next due dates
- Delete/pause stops generation
