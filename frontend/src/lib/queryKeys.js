export const qk = {
  me: ['me'],
  users: (q) => (q ? ['users', q] : ['users']),
  groups: ['groups'],
  group: (id) => ['group', id],
  groupExpenses: (id) => ['group', id, 'expenses'],
  groupBalances: (id) => ['group', id, 'balances'],
  groupActivity: (id) => ['group', id, 'activity'],
  groupSettlements: (id) => ['group', id, 'settlements'],
  meBalances: ['balances', 'me'],
  activity: ['activity'],
  groupRecurring: (id) => ['group', id, 'recurring'],
}
