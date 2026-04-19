# TatraSplit API contract (shared backend + frontend)

> **Implementation status:** This document tracks the shared API contract used by backend and frontend. Backend routes under `/api/v1` are implemented for core resources, and the frontend mock layer (`lib/mock.js`) mirrors this contract for local mock mode.

Base prefix: `/api/v1`  
Default local base URL: `http://localhost:8000/api/v1`

## Conventions

- All money fields are **integer cents** (`amount_cents`, `share_cents`, `net_cents`).
- IDs are serialized as **strings** in responses.
- Mutating endpoints also append to `activity`.
- Demo identity is driven by header `X-User-Handle` (fallback `@misha`).
- Frontend source of truth for that header is `localStorage` key `tatrasplit_user_handle` (read in `frontend/src/lib/api.js`).

## Endpoints

## Users

| Method | Path | Notes |
|---|---|---|
| GET | `/users/me` | Current user profile |
| GET | `/users` | User list; supports `q` search (`/users?q=luk`) |

## Groups

| Method | Path | Notes |
|---|---|---|
| POST | `/groups` | Create group (`name`, `emoji`, `currency`, `member_handles[]`), sends invitations instead of auto-adding members (except `is_direct=true`) |
| GET | `/groups` | List groups for current user |
| GET | `/groups/{id}` | Group detail with members |
| DELETE | `/groups/{group_id}` | Delete group (creator only); returns 400 if unsettled balances exist |
| POST | `/groups/{id}/members` | Add member(s) |
| DELETE | `/groups/{id}/members/{user_id}` | Remove member |
| GET | `/groups/{id}/invite` | Returns `invite_token` |
| POST | `/groups/join/{invite_token}` | Join by invite token |
| GET | `/groups/me/invites` | Pending invitations for current user |
| POST | `/groups/invites/{invite_id}/accept` | Accept pending invitation |
| POST | `/groups/invites/{invite_id}/decline` | Decline pending invitation |

### Group delete rules (`DELETE /groups/{group_id}`)

- Only the group creator can delete the group (`403` otherwise).
- If any member has non-zero `net_cents`, delete is blocked with `400` (`Group has unsettled balances`).
- For `jar_mode` groups, delete is also blocked unless jar `pot_balance_cents` is zero (`400`).
- No force override is supported.
- On success, the backend deletes the group and cascades cleanup of related `expenses`, `settlements`, `jar_contributions`, `jar_withdrawals`, and group-scoped `activity`.
- Success response: `{ "ok": true }`.

## Jar (group wallet)

| Method | Path | Notes |
|---|---|---|
| GET | `/groups/{id}/jar` | Jar state (contributions, withdrawals, proportional refunds, pot balance) |
| POST | `/groups/{id}/jar/contribute` | Member contributes to jar; amount is deducted from member wallet balance |
| POST | `/groups/{id}/jar/withdraw` | Creator withdraws from jar; amount is credited to creator wallet balance |
| POST | `/groups/{id}/jar/close` | Dissolve jar; remaining pot is distributed proportionally to contributors and credited to their wallet balances |

## Expenses

| Method | Path | Notes |
|---|---|---|
| GET | `/groups/{id}/expenses` | Group expense list (newest first) |
| POST | `/groups/{id}/expenses` | Create expense (`description`, `category`, `amount_cents`, `paid_by`, `split_type`, optional `split[]`) |
| GET | `/groups/{id}/expenses/{eid}` | Expense detail |
| DELETE | `/groups/{id}/expenses/{eid}` | Delete expense |

### Expense rules

- `split_type`: `equal` or `custom`.
- Server guarantees: `sum(split.share_cents) == amount_cents`.
- For equal split, server handles deterministic 1-cent remainder distribution.

## Settlements

| Method | Path | Notes |
|---|---|---|
| GET | `/groups/{id}/settlements` | Group settlements history |
| POST | `/groups/{id}/settlements` | Create settlement (`from_user`, `to_user`, `amount_cents`, `method`) |

## Balances

| Method | Path | Notes |
|---|---|---|
| GET | `/groups/{id}/balances` | Per-member net + `simplified_transfers` |
| GET | `/me/balances` | Cross-group totals + `by_group` + `by_category_last_30d` |

### `GET /groups/{id}/balances` response shape (core fields)

```json
{
  "currency": "EUR",
  "members": [
    { "user_id": "u1", "display_name": "Misha", "color": "hsl(...)", "net_cents": 1250 }
  ],
  "simplified_transfers": [
    { "from_user": "u2", "to_user": "u1", "amount_cents": 1250 }
  ]
}
```

## Activity

| Method | Path | Notes |
|---|---|---|
| GET | `/activity` | Global activity feed for current user |
| GET | `/groups/{id}/activity` | Activity feed scoped to group |

## Recurring

| Method | Path | Notes |
|---|---|---|
| GET | `/groups/{id}/recurring` | Active recurring expenses for group (sorted by next_due) |
| POST | `/groups/{id}/recurring` | Create recurring expense (`title`, `amount_cents`, `currency`, `category`, `paid_by`, `split_type`, `custom_split[]`, `frequency`) |
| DELETE | `/groups/{id}/recurring/{recurring_id}` | Deactivate recurring expense (soft delete) |
| POST | `/admin/process-recurring` | Trigger processing of all due recurring expenses |

### Recurring rules

- `frequency`: `weekly`, `biweekly`, or `monthly`.
- On processing, creates an expense in the group and advances `next_due`.
- Delete is soft — sets `active: false`.

## Admin

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/status` | Collection document counts |
| POST | `/admin/reset` | Drop all collections, reseed 4 demo users with 500 EUR each |
| POST | `/admin/seed` | Idempotent seed (only if no users exist) |

All admin endpoints accept optional `?secret=` query param (unused unless `ADMIN_SECRET` is configured).

## Frontend query mapping

This is how frontend hooks currently map to endpoints:

- `useMe` -> `GET /users/me`
- `useUsers` -> `GET /users`
- `useGroups` -> `GET /groups`
- `useGroup(id)` -> `GET /groups/{id}`
- `useGroupExpenses(id)` -> `GET /groups/{id}/expenses`
- `useGroupBalances(id)` -> `GET /groups/{id}/balances`
- `useGroupActivity(id)` -> `GET /groups/{id}/activity`
- `useMeBalances` -> `GET /me/balances`
- `useActivity` -> `GET /activity`
- `useCreateGroup` -> `POST /groups`
- `useDeleteGroup(groupId)` -> `DELETE /groups/{group_id}`
- `useAddExpense` -> `POST /groups/{id}/expenses`
- `useSettle` -> `POST /groups/{id}/settlements`
- `useGroupSettlements(id)` -> `GET /groups/{id}/settlements`
- `useGroupRecurring(id)` -> `GET /groups/{id}/recurring`
- `useCreateRecurring(id)` -> `POST /groups/{id}/recurring`
- `useDeleteRecurring(id)` -> `DELETE /groups/{id}/recurring/{recurring_id}`
- `usePayment` -> `POST /groups/{id}/settlements` (auto-finds/creates direct group first)
- `useJoinGroup` -> `POST /groups/join/{invite_token}`
- `useGroupInvites` -> `GET /groups/me/invites`
- `useRespondGroupInvite` -> `POST /groups/invites/{invite_id}/{accept|decline}`
