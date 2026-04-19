export function distributeEqualSplit(amountCents, memberIds = []) {
  const n = memberIds.length
  if (n === 0) return []
  const base = Math.floor(amountCents / n)
  const rem = amountCents - base * n
  return memberIds.map((id, i) => ({
    user_id: id,
    share_cents: base + (i < rem ? 1 : 0),
  }))
}

export function normalizeCustomSplit(split = []) {
  return split
    .filter((item) => item?.user_id)
    .map((item) => ({
      user_id: item.user_id,
      share_cents: Number.isFinite(item.share_cents) ? Math.max(0, Math.trunc(item.share_cents)) : 0,
    }))
}

export function sumSplitShares(split = []) {
  return split.reduce((sum, item) => sum + (item.share_cents || 0), 0)
}

export function applyCustomShareEdit({ split = [], userId, cents, amountCents }) {
  const parsed = Number.isFinite(cents) ? Math.trunc(cents) : 0
  const clampedCents = Math.max(0, Math.min(amountCents, parsed))
  const existing = split.find((s) => s.user_id === userId)

  const next = existing
    ? split.map((s) => (s.user_id === userId ? { ...s, share_cents: clampedCents } : s))
    : [...split, { user_id: userId, share_cents: clampedCents }]

  if (next.length === 2) {
    return next.map((s) =>
      s.user_id === userId ? { ...s, share_cents: clampedCents } : { ...s, share_cents: amountCents - clampedCents },
    )
  }

  return next
}

export function isSplitReady({ splitType, split, amountCents }) {
  if (!split.length) return false
  if (splitType !== 'custom') return true
  return sumSplitShares(split) === amountCents
}

export function getCustomSplitBudgetStatus({ splitType, split = [], amountCents = 0 }) {
  if (splitType !== 'custom') return { state: 'exact', remainderCents: 0 }
  const remainderCents = amountCents - sumSplitShares(split)
  if (remainderCents === 0) return { state: 'exact', remainderCents: 0 }
  if (remainderCents > 0) return { state: 'under', remainderCents }
  return { state: 'over', remainderCents: Math.abs(remainderCents) }
}

function haveSameMembers(memberIds = [], split = []) {
  if (!memberIds.length) return false
  const allIds = [...memberIds].sort().join(',')
  const splitIds = split.map((s) => s.user_id).sort().join(',')
  return allIds === splitIds
}

export function resolveSplitPayload({ splitType, split, allMemberIds = [], forceCustom = false }) {
  const normalized = normalizeCustomSplit(split)

  if (forceCustom || splitType === 'custom') {
    return { split_type: 'custom', custom_split: normalized }
  }

  if (splitType === 'equal') {
    if (haveSameMembers(allMemberIds, normalized)) {
      return { split_type: 'equal', custom_split: [] }
    }
    return { split_type: 'custom', custom_split: normalized }
  }

  return { split_type: 'custom', custom_split: normalized }
}
