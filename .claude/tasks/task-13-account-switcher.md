# task-13: Account switcher (demo)

## Status: pending

## Goal
Add a dropdown menu to the user avatar block in the sidebar so demo users can switch between the 4 seeded accounts without restarting the server.

## Where to add
**File:** `frontend/src/components/layout/AppShell.jsx`
- Lines 75-90: user avatar + name block at bottom of sidebar — make this clickable, trigger a `DropdownMenu` or `Popover`

## Implementation

### Frontend
1. Wrap the user block (lines 75-90) in a `DropdownMenu` trigger
2. Menu items: `@misha`, `@lukas`, `@nina`, `@tomas` (hardcoded — demo only)
3. Show display name + handle per item; checkmark on current user
4. On select:
   - Save handle to `localStorage` key `tatrasplit_user_handle`
   - No page reload needed — invalidate all queries via `invalidateGlobal(qc)` from `lib/invalidation.js`

### API layer
**File:** `frontend/src/lib/api.js`
- Add Axios request interceptor: reads `localStorage.getItem('tatrasplit_user_handle')` and sets `X-User-Handle` header on every request
- Default fallback: `@misha` (matches backend default)

### useMe hook
**File:** `frontend/src/hooks/useMe.js`
- No changes needed — `useMe()` will auto-refetch after query invalidation

## Seeded users (hardcoded in menu)
| Handle | Display name | Color |
|---|---|---|
| @misha | Misha F. | #14B8A6 |
| @lukas | Lukáš N. | #8B5CF6 |
| @nina | Nina K. | #F97316 |
| @tomas | Tomáš B. | #3B82F6 |

## Files changed
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/lib/api.js`

## Verification
- Clicking user block opens dropdown with 4 users
- Selecting different user updates avatar + name in sidebar
- All data (groups, balances, activity) refreshes to reflect selected user's perspective
- Persists across page refresh (localStorage)
