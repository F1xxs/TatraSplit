# Domain Model

## Core Entities

### Group
Top-level container. Owns a **Ledger** and a list of **Members**.

### Member
User participating in a Group. Identified by `user_id`. Has a net balance derived by the Engine.

### Ledger
Ordered log of **Transactions** belonging to a Group. Mutable — transactions can be added, edited, or removed. The Engine re-derives all balances from the full ledger on demand.

### Transaction
Atomic unit recorded in a Ledger. Two concrete types:

| Type | Description |
|------|-------------|
| **Expense** | Money paid to the outside world, split among members |
| **Transfer** | Direct payment from one Member to another within the Group |

### Expense *(Transaction)*
Represents an external cost. Fields:
- `paid_by` — Member who paid
- `amount_cents` — total cost
- `split` — how cost is distributed across Members (strategy: equal / custom / percentage / shares)
- `receipt` *(optional)* — reference to a Receipt that contains line items

### Transfer *(Transaction)*
Records a Member-to-Member payment (settlement). Fields:
- `from_user` — payer
- `to_user` — recipient
- `amount_cents`

### Receipt
Container for line-item Expenses (e.g. a restaurant bill). Each line item is an independent split. The parent Expense references the Receipt; its amount and split are the rollup of all items.

---

## Derived State

### Balance
Not stored — computed by the Engine on demand.

```
net(member) = Σ paid_by(expense) − Σ share(expense) + Σ received(transfer) − Σ sent(transfer)
```

### Simplified Transfers
Minimum set of payments to settle all debts. Derived from member nets via greedy heap algorithm.

---

## Relationships

```
Group
├── members: Member[]
└── ledger: Ledger
      └── transactions: Transaction[]
            ├── Expense
            │     └── receipt?: Receipt
            │           └── items: Expense[]
            └── Transfer
```

---

## Engine
Reads the full Ledger and produces:
- Per-member `net_cents`
- `simplified_transfers` list

Re-runs whenever Ledger changes.
