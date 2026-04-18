# TatraSplit API contract (shared backend + frontend)

Base prefix: `/api/v1`  
Default local base URL: `http://localhost:8000/api/v1`

## Conventions

- All money fields are **integer cents** (`amount_cents`, `share_cents`, `net_cents`).
- IDs are serialized as **strings** in responses.
- Mutating endpoints also append to `activity`.
- Demo identity can be set via header `X-User-Handle` (fallback is backend default user).

## Endpoints

## Users

| Method | Path | Notes |
|---|---|---|
| GET | `/users/me` | Current user profile |
| GET | `/users` | User list; supports `q` search (`/users?q=luk`) |

## Groups

| Method | Path | Notes |
|---|---|---|
| POST | `/groups` | Create group (`name`, `emoji`, `currency`, `member_handles[]`) |
| GET | `/groups` | List groups for current user |
| GET | `/groups/{id}` | Group detail with members |
| POST | `/groups/{id}/members` | Add member(s) |
| DELETE | `/groups/{id}/members/{user_id}` | Remove member |
| GET | `/groups/{id}/invite` | Returns `invite_token` |
| POST | `/groups/join/{invite_token}` | Join by invite token |

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
- `useAddExpense` -> `POST /groups/{id}/expenses`
- `useSettle` -> `POST /groups/{id}/settlements`
- `useJoinGroup` -> `POST /groups/join/{invite_token}`
