# task-14: Database management panel

## Status: pending

## Goal
Add ability to reset and repopulate the demo database from the UI — useful for live demos and development.

## Backend

### New file: `backend/app/api/routes/admin.py`
```
GET  /api/v1/admin/status   — collection document counts
POST /api/v1/admin/reset    — drop all collections + reseed (calls seed logic)
POST /api/v1/admin/seed     — safe populate (no drop, adds seed data if missing)
```

Implementation notes:
- Import `seed()` function from `app.services.seed`
- `reset` endpoint: call `seed(reset=True)`
- `seed` endpoint: call `seed(reset=False)`
- `status` endpoint: use `await db.command("collstats", ...)` or `count_documents({})` per collection
- No auth guard needed (demo only) — but can add a simple `?secret=` query param for safety

### Register in `backend/app/main.py`
```python
from app.api.routes.admin import router as admin_router
app.include_router(admin_router, prefix=prefix, tags=["admin"])
```

### Refactor `services/seed.py`
- Extract seeding logic into importable `async def seed(db, reset: bool)` that accepts a db instance
- Keep the `if __name__ == "__main__"` CLI entrypoint working

## Frontend

### New page: `frontend/src/pages/AdminPage.jsx`
- Accessible at `/admin`
- Three actions:
  1. **Reset & Reseed** — `POST /admin/reset` — clears all data, repopulates with demo seed
  2. **Populate** — `POST /admin/seed` — adds missing seed data without dropping
  3. **Status** — `GET /admin/status` — shows document counts per collection in a table
- After reset/seed: call `invalidateGlobal(qc)` from `lib/invalidation.js`
- Show loading states and success/error toasts

### Register route in `frontend/src/App.jsx`
```jsx
const AdminPage = lazy(() => import('./pages/AdminPage'))
// Add: <Route path="/admin" element={<Suspense ...><AdminPage /></Suspense>} />
```

### Add nav entry
- `AppShell.jsx` "More" button menu OR add to bottom nav as a wrench icon
- Label: "Admin" — only visible in dev / demo mode

## Files changed
**Backend:**
- `backend/app/api/routes/admin.py` (new)
- `backend/app/services/seed.py` (refactor to accept db param)
- `backend/app/main.py` (register router)

**Frontend:**
- `frontend/src/pages/AdminPage.jsx` (new)
- `frontend/src/App.jsx` (add lazy route)
- `frontend/src/components/layout/AppShell.jsx` (add nav entry)

## Verification
- `GET /api/v1/admin/status` returns count per collection
- `POST /api/v1/admin/reset` drops + reseeds; frontend data refreshes
- Admin page loads at `/admin` with working buttons
- Toast shown on success/error
