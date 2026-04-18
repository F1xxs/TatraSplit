# task-16: Contacts — view and add

## Status: pending

## Goal
Add a contacts system so users can save and browse people they split with frequently.

## Backend

### New collection: `contacts`
```
{ _id, owner_id, contact_user_id, added_at }
```
Index: `(owner_id, contact_user_id)` unique compound.

### New file: `backend/app/api/routes/contacts.py`
- `GET /contacts` — list current user's contacts (populated with user docs)
- `POST /contacts` — add contact by user_id or handle
- `DELETE /contacts/{contact_id}` — remove contact

Register in `main.py`.

### Update `services/seed.py`
Seed some contacts between demo users.

## Frontend

### New page: `frontend/src/pages/ContactsPage.jsx`
- Route: `/contacts`
- List of contacts with avatar, name, handle
- Search bar to find users (uses existing `GET /users?q=` endpoint)
- "Add" button per search result
- "Remove" button per existing contact

### Nav entry
Add "Contacts" to sidebar/bottom nav in `AppShell.jsx` (people icon).

### New hook: `frontend/src/hooks/useContacts.js`
- `useContacts()` — list contacts
- `useAddContact()` — mutation
- `useRemoveContact()` — mutation

## Files changed
**Backend:** `api/routes/contacts.py` (new), `main.py`, `services/seed.py`, `core/db.py` (add index)
**Frontend:** `pages/ContactsPage.jsx` (new), `hooks/useContacts.js` (new), `App.jsx`, `AppShell.jsx`

## Verification
- Contacts page shows saved contacts
- Search + add works
- Remove works
- Persists across refresh
