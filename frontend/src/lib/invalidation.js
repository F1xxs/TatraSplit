import { qk } from '@/lib/queryKeys'

/** Invalidate cross-group global caches (groups list, me balances, global activity, wallet). */
export function invalidateGlobal(qc) {
  qc.invalidateQueries({ queryKey: qk.me })
  qc.invalidateQueries({ queryKey: qk.groups })
  qc.invalidateQueries({ queryKey: qk.meBalances })
  qc.invalidateQueries({ queryKey: qk.activity })
  qc.invalidateQueries({ queryKey: qk.me })
  qc.invalidateQueries({ queryKey: qk.users() })
}

/** Invalidate all caches scoped to a specific group. */
export function invalidateGroup(qc, id) {
  qc.invalidateQueries({ queryKey: qk.group(id) })
  qc.invalidateQueries({ queryKey: qk.groupExpenses(id) })
  qc.invalidateQueries({ queryKey: qk.groupBalances(id) })
  qc.invalidateQueries({ queryKey: qk.groupActivity(id) })
  qc.invalidateQueries({ queryKey: qk.groupSettlements(id) })
}
