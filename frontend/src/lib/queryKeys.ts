export const qk = {
  me: ["me"],
  users: (q?: string) => (q ? ["users", q] : ["users"]),
  groups: ["groups"],
  contacts: ["contacts"],
  group: (id: string) => ["group", id],
  groupExpenses: (id: string) => ["group", id, "expenses"],
  groupReceipts: (id: string) => ["group", id, "receipts"],
  groupBalances: (id: string) => ["group", id, "balances"],
  groupActivity: (id: string) => ["group", id, "activity"],
  groupTransfers: (id: string) => ["group", id, "transfers"],
};
