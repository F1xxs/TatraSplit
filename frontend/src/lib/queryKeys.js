export const qk = {
  me: ['me'],
  users: (q) => (q ? ['users', q] : ['users']),
  groups: ['groups'],
  contacts: ['contacts'],
  group: (id) => ['group', id],
  groupExpenses: (id) => ['group', id, 'expenses'],
  groupReceipts: (id) => ['group', id, 'receipts'],
  groupBalances: (id) => ['group', id, 'balances'],
  groupActivity: (id) => ['group', id, 'activity'],
  groupTransfers: (id) => ['group', id, 'transfers'],
}
