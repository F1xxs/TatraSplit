// Deterministic in-memory mock for local demo while the backend isn't up.
// Enable by leaving VITE_USE_MOCK unset (default) or setting to "true".
// Disable with VITE_USE_MOCK=false.

const nowIso = () => new Date().toISOString()
const daysAgo = (n) => new Date(Date.now() - n * 86400 * 1000).toISOString()

const users = [
  { id: 'u_misha', display_name: 'Misha', handle: '@misha', color: 'hsl(210 90% 62%)' },
  { id: 'u_lukas', display_name: 'Lukas Novak',  handle: '@lukas', color: 'hsl(199 89% 65%)' },
  { id: 'u_nina',  display_name: 'Nina Kovac',   handle: '@nina',  color: 'hsl(340 82% 65%)' },
  { id: 'u_tomas', display_name: 'Tomas Horvat', handle: '@tomas', color: 'hsl(142 72% 55%)' },
]

const byId = Object.fromEntries(users.map((u) => [u.id, u]))
const byHandle = Object.fromEntries(users.map((u) => [u.handle, u]))

const mockUserSelector = import.meta.env.VITE_MOCK_USER
const me = (() => {
  if (!mockUserSelector) return byId['u_misha']
  if (byId[mockUserSelector]) return byId[mockUserSelector]
  if (byHandle[mockUserSelector]) return byHandle[mockUserSelector]
  console.warn(`Unknown VITE_MOCK_USER '${mockUserSelector}', defaulting to u_misha`)
  return byId['u_misha']
})()

const uid = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

function httpError(status, detail) {
  const err = new Error(detail)
  err.response = { status, data: { detail } }
  return err
}

const groups = [
  {
    id: 'g_roommates',
    name: 'Roommates',
    emoji: '🏠',
    currency: 'EUR',
    member_ids: ['u_misha', 'u_lukas', 'u_nina'],
    created_by: 'u_misha',
    invite_token: 'roommates-demo-001',
    created_at: daysAgo(40),
  },
  {
    id: 'g_tatras',
    name: 'Tatras Trip',
    emoji: '⛰️',
    currency: 'EUR',
    member_ids: ['u_misha', 'u_tomas', 'u_nina'],
    created_by: 'u_misha',
    invite_token: 'tatras-demo-002',
    created_at: daysAgo(14),
  },
]

const expenses = [
  mkExpense('g_roommates', 'Rent',              'rent',          90000, 'u_misha', ['u_misha','u_lukas','u_nina'], 30),
  mkExpense('g_roommates', 'Groceries',         'groceries',      4820, 'u_lukas', ['u_misha','u_lukas','u_nina'], 28),
  mkExpense('g_roommates', 'Internet',          'utilities',      2999, 'u_nina',  ['u_misha','u_lukas','u_nina'], 25),
  mkExpense('g_roommates', 'Cleaning supplies', 'other',          1250, 'u_lukas', ['u_misha','u_lukas','u_nina'], 20),
  mkExpense('g_roommates', 'Electricity',       'utilities',      6000, 'u_nina',  ['u_misha','u_lukas','u_nina'], 7),
  mkExpense('g_roommates', 'Kaufland run',      'groceries',      5680, 'u_misha', ['u_misha','u_lukas','u_nina'], 3),
  mkExpense('g_tatras',    'Gas',               'transport',      5500, 'u_tomas', ['u_misha','u_tomas','u_nina'], 10),
  mkExpense('g_tatras',    'Cabin',             'entertainment', 18000, 'u_misha', ['u_misha','u_tomas','u_nina'], 9),
  mkExpense('g_tatras',    'Dinner at Koliba',  'food',           7250, 'u_nina',  ['u_misha','u_tomas','u_nina'], 8),
  mkExpense('g_tatras',    'Lift tickets',      'entertainment',  9000, 'u_tomas', ['u_misha','u_tomas','u_nina'], 6),
]

const settlements = [
  {
    id: 's_01',
    group_id: 'g_roommates',
    from_user: 'u_lukas',
    to_user: 'u_misha',
    amount_cents: 10000,
    currency: 'EUR',
    method: 'mock_transfer',
    created_at: daysAgo(12),
  },
]

const activity = []
let activitySeq = 0
function logActivity(kind, actor_id, group_id, payload) {
  activity.unshift({
    id: `a_${++activitySeq}_${Date.now()}`,
    group_id,
    actor_id,
    kind,
    payload,
    created_at: nowIso(),
  })
}

// Seed initial activity
for (const g of groups) {
  logActivity('group.created', g.created_by, g.id, {
    actor_name: byId[g.created_by].display_name,
    group_name: g.name,
  })
}
for (const e of expenses) {
  logActivity('expense.created', e.paid_by, e.group_id, {
    actor_name: byId[e.paid_by].display_name,
    group_name: groups.find((g) => g.id === e.group_id)?.name,
    description: e.description,
    amount_cents: e.amount_cents,
    currency: e.currency,
  })
}
for (const s of settlements) {
  logActivity('settlement.created', s.from_user, s.group_id, {
    actor_name: byId[s.from_user].display_name,
    to_name: byId[s.to_user].display_name,
    group_name: groups.find((g) => g.id === s.group_id)?.name,
    amount_cents: s.amount_cents,
    currency: s.currency,
  })
}

function mkExpense(gid, description, category, cents, paid_by, memberIds, dayOffset) {
  const n = memberIds.length
  const base = Math.floor(cents / n)
  const rem = cents - base * n
  return {
    id: uid('e'),
    group_id: gid,
    description,
    category,
    amount_cents: cents,
    currency: 'EUR',
    paid_by,
    split_type: 'equal',
    split: memberIds.map((uid, i) => ({
      user_id: uid,
      share_cents: base + (i < rem ? 1 : 0),
    })),
    created_by: paid_by,
    created_at: daysAgo(dayOffset),
  }
}

function populate(group) {
  return {
    ...group,
    members: group.member_ids.map((id) => byId[id]),
  }
}

function netsForGroup(gid) {
  const members = groups.find((g) => g.id === gid).member_ids
  const net = Object.fromEntries(members.map((m) => [m, 0]))
  for (const e of expenses.filter((e) => e.group_id === gid)) {
    net[e.paid_by] = (net[e.paid_by] || 0) + e.amount_cents
    for (const s of e.split) {
      net[s.user_id] = (net[s.user_id] || 0) - s.share_cents
    }
  }
  for (const s of settlements.filter((s) => s.group_id === gid)) {
    net[s.from_user] = (net[s.from_user] || 0) + s.amount_cents
    net[s.to_user] = (net[s.to_user] || 0) - s.amount_cents
  }
  return net
}

function simplify(net) {
  const entries = Object.entries(net)
    .map(([uid, v]) => ({ uid, v }))
    .filter((e) => Math.abs(e.v) >= 1)
  const creditors = entries.filter((e) => e.v > 0).sort((a, b) => b.v - a.v)
  const debtors = entries.filter((e) => e.v < 0).sort((a, b) => a.v - b.v)
  const transfers = []
  let i = 0
  let j = 0
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i]
    const d = debtors[j]
    const amt = Math.min(c.v, -d.v)
    if (amt <= 0) break
    transfers.push({ from_user: d.uid, to_user: c.uid, amount_cents: amt })
    c.v -= amt
    d.v += amt
    if (c.v < 1) i++
    if (-d.v < 1) j++
  }
  return transfers
}

function groupBalances(gid) {
  const group = groups.find((g) => g.id === gid)
  const net = netsForGroup(gid)
  const members = group.member_ids.map((id) => ({
    user_id: id,
    display_name: byId[id].display_name,
    color: byId[id].color,
    net_cents: net[id] ?? 0,
  }))
  return {
    currency: group.currency,
    members,
    simplified_transfers: simplify({ ...net }),
  }
}

function meBalances() {
  let owed_to_me = 0
  let i_owe = 0
  const by_group = []
  for (const g of groups) {
    if (!g.member_ids.includes(me.id)) continue
    const net = netsForGroup(g.id)
    const my = net[me.id] || 0
    if (my > 0) owed_to_me += my
    else i_owe += -my
    by_group.push({
      group_id: g.id,
      group_name: g.name,
      emoji: g.emoji,
      net_cents: my,
    })
  }
  // Category rollup for last 30d, weighted by my share
  const cutoff = Date.now() - 30 * 86400 * 1000
  const byCat = {}
  for (const e of expenses) {
    const t = new Date(e.created_at).getTime()
    if (t < cutoff) continue
    const myShare = e.split.find((s) => s.user_id === me.id)?.share_cents || 0
    if (myShare <= 0) continue
    byCat[e.category] = (byCat[e.category] || 0) + myShare
  }
  return {
    total_owed_to_me_cents: owed_to_me,
    total_i_owe_cents: i_owe,
    by_group,
    by_category_last_30d: Object.entries(byCat).map(([category, spent_cents]) => ({
      category,
      spent_cents,
    })),
  }
}

export async function handleMock(method, url, data) {
  await new Promise((r) => setTimeout(r, 220 + Math.random() * 180))
  const u = url.replace(/^\/+/, '')

  // /users/me
  if (method === 'GET' && u === 'users/me') return me
  if (method === 'GET' && u === 'users') return users

  // groups list
  if (method === 'GET' && u === 'groups') {
    return groups
      .filter((g) => g.member_ids.includes(me.id))
      .map((g) => {
        const nets = netsForGroup(g.id)
        return { ...populate(g), net_cents: nets[me.id] || 0 }
      })
  }

  // group detail
  let m = u.match(/^groups\/([^/]+)$/)
  if (method === 'DELETE' && m) {
    const gid = m[1]
    const idx = groups.findIndex((x) => x.id === gid)
    if (idx < 0) throw httpError(404, 'Group not found')

    const g = groups[idx]
    if (g.created_by !== me.id) {
      throw httpError(403, 'Only the group creator can delete this group.')
    }

    const hasUnsettled = groupBalances(gid).members.some((m) => Math.abs(m.net_cents || 0) >= 1)
    if (hasUnsettled) {
      throw httpError(400, 'Group has unsettled balances. Settle up before deleting.')
    }

    logActivity('group.deleted', me.id, null, {
      actor_name: me.display_name,
      group_name: g.name,
    })

    groups.splice(idx, 1)
    for (let i = expenses.length - 1; i >= 0; i--) {
      if (expenses[i].group_id === gid) expenses.splice(i, 1)
    }
    for (let i = settlements.length - 1; i >= 0; i--) {
      if (settlements[i].group_id === gid) settlements.splice(i, 1)
    }
    for (let i = activity.length - 1; i >= 0; i--) {
      if (activity[i].group_id === gid) activity.splice(i, 1)
    }

    return { id: gid, deleted: true }
  }
  if (method === 'GET' && m) {
    const g = groups.find((x) => x.id === m[1])
    return g ? populate(g) : null
  }

  // POST /groups
  if (method === 'POST' && u === 'groups') {
    const handles = [...(data?.member_handles || [])]
    const member_ids = [me.id]
    for (const h of handles) {
      const u2 = byHandle[h]
      if (u2 && !member_ids.includes(u2.id)) member_ids.push(u2.id)
    }
    const g = {
      id: uid('g'),
      name: data.name || 'New group',
      emoji: data.emoji || '👥',
      currency: data.currency || 'EUR',
      member_ids,
      created_by: me.id,
      invite_token: uid('inv'),
      created_at: nowIso(),
    }
    groups.push(g)
    logActivity('group.created', me.id, g.id, { actor_name: me.display_name, group_name: g.name })
    return populate(g)
  }

  // /groups/:id/invite
  m = u.match(/^groups\/([^/]+)\/invite$/)
  if (method === 'GET' && m) {
    const g = groups.find((x) => x.id === m[1])
    return g ? { invite_token: g.invite_token } : null
  }

  // /groups/join/:token
  m = u.match(/^groups\/join\/([^/?]+)/)
  if (method === 'POST' && m) {
    const g = groups.find((x) => x.invite_token === m[1])
    if (!g) throw new Error('Invite link not found')
    if (!g.member_ids.includes(me.id)) {
      g.member_ids.push(me.id)
      logActivity('member.joined', me.id, g.id, {
        actor_name: me.display_name,
        group_name: g.name,
      })
    }
    return populate(g)
  }

  // expenses
  m = u.match(/^groups\/([^/]+)\/expenses$/)
  if (method === 'GET' && m) {
    return expenses
      .filter((e) => e.group_id === m[1])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
  if (method === 'POST' && m) {
    const gid = m[1]
    const group = groups.find((g) => g.id === gid)
    if (!group) throw new Error('Group not found')
    let split = data.split
    if (data.split_type === 'equal' || !split?.length) {
      const ids = group.member_ids
      const n = ids.length
      const base = Math.floor(data.amount_cents / n)
      const rem = data.amount_cents - base * n
      split = ids.map((uid, i) => ({ user_id: uid, share_cents: base + (i < rem ? 1 : 0) }))
    }
    const e = {
      id: uid('e'),
      group_id: gid,
      description: data.description,
      category: data.category,
      amount_cents: data.amount_cents,
      currency: data.currency || group.currency,
      paid_by: data.paid_by,
      split,
      split_type: data.split_type || 'equal',
      created_by: me.id,
      created_at: nowIso(),
    }
    expenses.push(e)
    logActivity('expense.created', data.paid_by, gid, {
      actor_name: byId[data.paid_by].display_name,
      group_name: group.name,
      description: e.description,
      amount_cents: e.amount_cents,
      currency: e.currency,
    })
    return e
  }

  // balances
  m = u.match(/^groups\/([^/]+)\/balances$/)
  if (method === 'GET' && m) return groupBalances(m[1])

  if (method === 'GET' && u === 'me/balances') return meBalances()

  // activity
  m = u.match(/^groups\/([^/]+)\/activity$/)
  if (method === 'GET' && m) return activity.filter((a) => a.group_id === m[1])
  if (method === 'GET' && u === 'activity') {
    return activity.filter((a) => {
      if (!a.group_id) return true
      const g = groups.find((gg) => gg.id === a.group_id)
      return g && g.member_ids.includes(me.id)
    })
  }

  // settlements
  m = u.match(/^groups\/([^/]+)\/settlements$/)
  if (method === 'POST' && m) {
    const gid = m[1]
    const group = groups.find((g) => g.id === gid)
    if (!group) throw new Error('Group not found')
    const s = {
      id: uid('s'),
      group_id: gid,
      from_user: data.from_user,
      to_user: data.to_user,
      amount_cents: data.amount_cents,
      currency: data.currency || group.currency,
      method: data.method || 'mock_transfer',
      created_at: nowIso(),
    }
    settlements.push(s)
    logActivity('settlement.created', s.from_user, gid, {
      actor_name: byId[s.from_user].display_name,
      to_name: byId[s.to_user].display_name,
      group_name: group.name,
      amount_cents: s.amount_cents,
      currency: s.currency,
    })
    return s
  }
  if (method === 'GET' && m) return settlements.filter((s) => s.group_id === m[1])

  throw Object.assign(new Error(`Mock: unhandled ${method} /${u}`), { code: 'MOCK_UNHANDLED' })
}
