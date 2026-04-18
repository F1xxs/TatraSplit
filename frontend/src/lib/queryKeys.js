export const qk = {
  me: ['me'],
  users: (q) => (q ? ['users', q] : ['users']),
  groups: ['groups'],
  group: (id) => ['group', id],
  groupExpenses: (id) => ['group', id, 'expenses'],
  groupBalances: (id) => ['group', id, 'balances'],
  groupActivity: (id) => ['group', id, 'activity'],
  meBalances: ['balances', 'me'],
  activity: ['activity'],
}
