import test from 'node:test'
import assert from 'node:assert/strict'
import {
  distributeEqualSplit,
  normalizeCustomSplit,
  sumSplitShares,
  isSplitReady,
  applyCustomShareEdit,
} from './split.js'

test('distributeEqualSplit deterministically assigns remainder to first members', () => {
  const memberIds = ['u1', 'u2', 'u3']
  const result = distributeEqualSplit(1000, memberIds)

  assert.deepEqual(result, [
    { user_id: 'u1', share_cents: 334 },
    { user_id: 'u2', share_cents: 333 },
    { user_id: 'u3', share_cents: 333 },
  ])
  assert.equal(sumSplitShares(result), 1000)
})

test('custom split normalization and readiness checks are strict', () => {
  const normalized = normalizeCustomSplit([
    { user_id: 'u1', share_cents: 180.9 },
    { user_id: 'u2', share_cents: -20 },
    { user_id: 'u3', share_cents: Number.POSITIVE_INFINITY },
    { share_cents: 50 },
  ])

  assert.deepEqual(normalized, [
    { user_id: 'u1', share_cents: 180 },
    { user_id: 'u2', share_cents: 0 },
    { user_id: 'u3', share_cents: 0 },
  ])
  assert.equal(sumSplitShares(normalized), 180)
  assert.equal(isSplitReady({ splitType: 'custom', split: normalized, amountCents: 200 }), false)
  assert.equal(isSplitReady({ splitType: 'custom', split: normalized, amountCents: 180 }), true)
})

test('applyCustomShareEdit auto-balances 2-person custom split and clamps values', () => {
  const amountCents = 1000

  const initialized = applyCustomShareEdit({
    split: [{ user_id: 'u1', share_cents: 500 }],
    userId: 'u2',
    cents: 700,
    amountCents,
  })
  assert.deepEqual(initialized, [
    { user_id: 'u1', share_cents: 300 },
    { user_id: 'u2', share_cents: 700 },
  ])

  const clampedHigh = applyCustomShareEdit({
    split: initialized,
    userId: 'u1',
    cents: 99999,
    amountCents,
  })
  assert.deepEqual(clampedHigh, [
    { user_id: 'u1', share_cents: 1000 },
    { user_id: 'u2', share_cents: 0 },
  ])

  const clampedLow = applyCustomShareEdit({
    split: initialized,
    userId: 'u2',
    cents: -50,
    amountCents,
  })
  assert.deepEqual(clampedLow, [
    { user_id: 'u1', share_cents: 1000 },
    { user_id: 'u2', share_cents: 0 },
  ])
})
