# Expense Import

Upload a JSON file to pre-fill the Add Expense form. Nothing is saved to the database — the endpoint parses the file and returns resolved field values for the frontend to seed the form.

## Endpoint

```
POST /api/v1/groups/{group_id}/import/expense
Content-Type: multipart/form-data
field: file
```

Requires auth. Returns 200 with parsed expense shape on success.

---

## Input file format

```json
{
  "description": "Rent",
  "amount_cents": 150000,
  "category": "rent",
  "note": "March",
  "paid_by": "@bohdan",
  "split": {
    "type": "equal",
    "members": [
      { "user_id": "@oshi", "value": 1 },
      { "user_id": "@anna", "value": 1 }
    ]
  }
}
```

All fields except `description` are optional.

| Field | Type | Notes |
|---|---|---|
| `description` | string | Required. Whitespace stripped. |
| `amount_cents` | integer | Default `0`. Must be non-negative. |
| `category` | string | See valid values below. Unknown value falls back to `"other"`. |
| `note` | string | Default `""`. |
| `paid_by` | string | Handle with or without `@`. Resolved to user ID. |
| `split.type` | string | `equal`, `custom`, `percentage`, `shares`. Default `equal`. |
| `split.members[].user_id` | string | Handle with or without `@`. Resolved to user ID. |
| `split.members[].value` | number | Default `1`. Meaning depends on split type. |

Valid categories: `food`, `transport`, `accommodation`, `entertainment`, `utilities`, `home`, `health`, `shopping`, `groceries`, `rent`, `other`.

---

## How parsing works

### Step 1 — file extension check

`.yaml` / `.yml` → immediate `400 ValidationError("YAML import not yet supported")`.
Any other extension proceeds.

### Step 2 — JSON + field validation (Pydantic)

`ExpenseJsonParser` calls `ExpenseImportPayload.model_validate_json(data)`.

- Invalid JSON → `400 ValidationError`
- `description` missing or blank after strip → `400 ValidationError`
- `amount_cents` negative → `400 ValidationError`
- `category` unknown → silently replaced with `"other"`
- Extra fields in JSON → silently ignored

### Step 3 — handle resolution

`ExpenseImportService` fetches all members of the group and builds a lookup table:

```
{ "bohdan": "<mongo_id>", "oshi": "<mongo_id>", ... }
```

`@` prefix is stripped before lookup, so `@bohdan` and `bohdan` both work.

**`paid_by`** — resolved to a user ID string, or `null` if the handle is not a member of the group. Frontend falls back to current user when `null`.

**`split.members`** — each member handle resolved individually. Members that don't match any group member are **silently dropped**. If no members resolve, `split` in the response is `null` and the frontend keeps its default equal split.

Group not found → `404 NotFoundError`.

---

## Response shape

```json
{
  "description": "Rent",
  "amount_cents": 150000,
  "category": "rent",
  "note": "March",
  "paid_by": "664f1a2b3c4d5e6f7a8b9c0d",
  "split": {
    "type": "equal",
    "members": [
      { "user_id": "664f1a2b3c4d5e6f7a8b9c0e", "value": 1.0 },
      { "user_id": "664f1a2b3c4d5e6f7a8b9c0f", "value": 1.0 }
    ]
  }
}
```

`paid_by` and `split` can be `null` — frontend handles both cases.

---

## Error reference

| Condition | HTTP | Message |
|---|---|---|
| `.yaml` / `.yml` file | 400 | `YAML import not yet supported` |
| Invalid JSON | 400 | Pydantic validation error details |
| `description` blank | 400 | `description is required` |
| `amount_cents` negative | 400 | `amount_cents must be non-negative` |
| Group not found | 404 | `Group not found` |
| Handle not in group | 200 | Field set to `null` (not an error) |
| All split members unknown | 200 | `split` set to `null` (not an error) |

---

## Examples

### Minimal file

```json
{ "description": "Pizza" }
```

Response: `amount_cents: 0`, `category: "other"`, `paid_by: null`, `split: null`.

### Unknown handle

```json
{ "description": "Taxi", "paid_by": "@ghost" }
```

`@ghost` not in group → `paid_by: null` in response. No error.

### Unknown category

```json
{ "description": "Stuff", "category": "snacks" }
```

`"snacks"` not valid → `category: "other"` in response. No error.

### Mixed split — some members unknown

```json
{
  "description": "Dinner",
  "split": {
    "type": "equal",
    "members": [
      { "user_id": "@oshi" },
      { "user_id": "@ghost" }
    ]
  }
}
```

`@oshi` resolves, `@ghost` drops → split has one member. Frontend recalculates amounts.
