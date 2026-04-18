# task-20: Manage group members (add/remove UI)

## Status: pending

## Goal
Add frontend UI for adding and removing members from existing groups. Backend routes already exist.

## Existing backend
- `POST /groups/{group_id}/members` — add member (body: `{ user_id }`)
- `DELETE /groups/{group_id}/members/{user_id}` — remove member (creator or self only)

## Frontend

### Members sheet/dialog in GroupDetailPage
**File:** `frontend/src/pages/GroupDetailPage.jsx`

The "Members" button already exists (seen in Playwright snapshot). Wire it up to open a sheet/dialog showing:
1. **Member list** — avatar, name, handle per member
2. **Remove button** per member (only visible if current user is group creator)
3. **"Leave group"** button for self-removal
4. **Add member section** at bottom:
   - User search input (uses existing `GET /users?q=` endpoint)
   - "Add" button per search result
   - After add: invalidate group queries

### New hook additions: `frontend/src/hooks/useMutations.js`
- `useAddMember(groupId)` — calls `POST /groups/{group_id}/members`
- `useRemoveMember(groupId)` — calls `DELETE /groups/{group_id}/members/{user_id}`
- Both call `invalidateGroup(qc, groupId)` on success

### Mock layer update: `frontend/src/lib/mock.js`
- Add mock handler for `DELETE /groups/:id/members/:userId`

## Files changed
**Frontend:** `pages/GroupDetailPage.jsx`, `hooks/useMutations.js`, `lib/mock.js`

## Verification
- Members button opens sheet with member list
- Can search and add new member
- New member appears in list immediately
- Creator can remove other members
- Any member can leave (remove self)
- Balances recalculate after member changes
