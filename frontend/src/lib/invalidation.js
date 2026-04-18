import { qk } from '@/lib/queryKeys'

/** Invalidate cross-group global caches (groups list, me balances, global activity). */
export function invalidateGlobal(qc) {
  qc.invalidateQueries({ queryKey: qk.groups })
  qc.invalidateQueries({ queryKey: qk.meBalances })
  qc.invalidateQueries({ queryKey: qk.activity })
}

/** Invalidate all caches scoped to a specific group. */
export function invalidateGroup(qc, id) {
  qc.invalidateQueries({ queryKey: qk.group(id) })
  qc.invalidateQueries({ queryKey: qk.groupExpenses(id) })
  qc.invalidateQueries({ queryKey: qk.groupBalances(id) })
  qc.invalidateQueries({ queryKey: qk.groupActivity(id) })
}
