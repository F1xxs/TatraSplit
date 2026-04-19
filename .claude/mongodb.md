# MongoDB Usage Guidelines

## Connection

Motor async client, initialized in `core/db.py` lifespan. Stored on `app.state.db`. Access via `get_db` FastAPI dependency (reads from `request.app.state.db`).

```python
from app.api.deps import get_db

async def my_route(db=Depends(get_db)):
    ...
```

## Collections

| Collection    | Key fields |
|---|---|
| `users`       | `_id`, `handle` (unique), `display_name`, `avatar_url`, `color`, `balance_cents`, `currency` |
| `groups`      | `_id`, `name`, `emoji`, `currency`, `member_ids[]`, `created_by`, `invite_token`, `created_at` |
| `group_invites` | `_id`, `group_id`, `invited_user_id`, `invited_by_user_id`, `status` (`pending/accepted/declined`), `created_at`, `responded_at` |
| `expenses`    | `_id`, `group_id`, `paid_by`, `amount_cents`, `category`, `split[]` (`user_id`, `share_cents`), `created_at` |
| `settlements` | `_id`, `group_id`, `from_user`, `to_user`, `amount_cents`, `currency`, `method`, `note`, `created_at` |
| `activity`    | `_id`, `group_id`, `actor_id`, `kind`, `payload`, `created_at` |
| `recurring`   | `_id`, `group_id`, `title`, `amount_cents`, `currency`, `category`, `paid_by`, `split_type`, `custom_split[]`, `frequency`, `next_due`, `active`, `created_by`, `created_at` |

## Indexes (created on startup)

```python
users.create_index("handle", unique=True)
groups.create_index("invite_token", unique=True, sparse=True)
groups.create_index("member_ids")
group_invites.create_index([("invited_user_id", ASC), ("status", ASC), ("created_at", DESC)])
group_invites.create_index([("group_id", ASC), ("invited_user_id", ASC), ("status", ASC)])
expenses.create_index([("group_id", ASC), ("created_at", DESC)])
expenses.create_index("paid_by")
expenses.create_index("split.user_id")
settlements.create_index([("group_id", ASC), ("created_at", DESC)])
activity.create_index([("created_at", DESC)])
activity.create_index([("group_id", ASC), ("created_at", DESC)])
recurring.create_index([("group_id", ASC), ("active", ASC), ("next_due", ASC)])
```

Always query by indexed fields. `group_id` + `created_at` is the primary access pattern for expenses/settlements/activity.

## ID rules

- MongoDB stores `_id` as `ObjectId`
- IDs are passed as strings everywhere in the API layer
- Always validate before casting: `ObjectId.is_valid(id)` → `ObjectId(id)`
- All IDs stored in arrays (e.g. `member_ids`, `paid_by`, `from_user`, `to_user`) are stored as **strings**, not ObjectIds — consistent with how they come in from the API

## Query patterns

**Find by group, sorted by date:**
```python
await db.expenses.find({"group_id": group_id}).sort("created_at", -1).to_list(None)
```

**Find group for current user:**
```python
await db.groups.find({"member_ids": me_id}).sort("created_at", -1).to_list(None)
```

**Add member idempotently:**
```python
await db.groups.update_one({"_id": ObjectId(group_id)}, {"$addToSet": {"member_ids": user_id}})
```

**Remove member:**
```python
await db.groups.update_one({"_id": ObjectId(group_id)}, {"$pull": {"member_ids": user_id}})
```

## Serialization

Always pass raw Motor documents through `sdoc()` / `sdocs()` from `app.lib` before returning:

```python
from app.lib import sdoc, sdocs

doc = await db.groups.find_one({"_id": ObjectId(group_id)})
return sdoc(doc)  # _id → id (str), ObjectId → str, datetime → ISO
```

Never return raw documents. Never access `doc["_id"]` in route handlers.

## Balance calculation

No aggregation pipelines — balances are computed in Python (`services/balances.py`):
1. Iterate expenses: `paid_by` user gains `amount_cents`, each split user loses `share_cents`
2. Iterate settlements: `from_user` gains, `to_user` loses
3. Result is `net: dict[user_id, int]` — positive = owed, negative = owes

Debt simplification: greedy max-creditor/max-debtor pairing in `services/simplify.py`. Produces ≤ n−1 transfers, O(n log n).

## Seed data

```bash
cd backend
python -m app.services.seed --reset   # drops + recreates all collections
```

Seeds users (`@misha`, `@lukas`, `@nina`, `@tomas`), two groups, expenses, settlements, activity.
