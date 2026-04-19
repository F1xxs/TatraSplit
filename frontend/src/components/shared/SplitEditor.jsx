import { useEffect, useMemo } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'
import { distributeEqualSplit, applyCustomShareEdit } from '@/lib/split'

// eslint-disable-next-line react-refresh/only-export-components
export const distributeEqual = distributeEqualSplit

export function SplitEditor({
  members,
  amountCents,
  currency = 'EUR',
  splitType,
  onSplitTypeChange,
  split,
  onSplitChange,
  payerId,
}) {
  const memberIds = members.map((m) => m.id)
  const memberIdsKey = memberIds.join(',')
  const includedIds = split.map((s) => s.user_id)
  const sum = split.reduce((a, s) => a + (s.share_cents || 0), 0)
  const remainder = amountCents - sum
  const canShowQuickActions = splitType === 'custom' && members.length >= 3
  const payerShare = split.find((s) => s.user_id === payerId)?.share_cents ?? 0
  const canAssignToPayer = Boolean(payerId) && memberIds.includes(payerId) && payerShare + remainder >= 0

  const setIncluded = (id, included) => {
    let next
    if (included) {
      const ids = [...includedIds, id]
      next = distributeEqualSplit(amountCents, ids)
    } else {
      const ids = includedIds.filter((x) => x !== id)
      next = distributeEqualSplit(amountCents, ids)
    }
    onSplitChange(next)
  }

  const setCustomShare = (id, cents) => {
    onSplitChange(applyCustomShareEdit({ split, userId: id, cents, amountCents }))
  }

  const withAllMembers = useMemo(
    () =>
      members.map((m) => ({
        user_id: m.id,
        share_cents: split.find((s) => s.user_id === m.id)?.share_cents ?? 0,
      })),
    [members, split],
  )

  const resetToEqual = () => {
    onSplitChange(distributeEqualSplit(amountCents, memberIds))
  }

  const autoFixRemainder = () => {
    if (remainder === 0) return
    let left = remainder
    const next = withAllMembers.map((s) => ({ ...s }))

    if (left > 0) {
      let i = 0
      while (left > 0) {
        const idx = i % next.length
        next[idx].share_cents += 1
        left -= 1
        i += 1
      }
      onSplitChange(next)
      return
    }

    left = Math.abs(left)
    while (left > 0) {
      let changed = false
      for (let i = 0; i < next.length && left > 0; i += 1) {
        if (next[i].share_cents > 0) {
          next[i].share_cents -= 1
          left -= 1
          changed = true
        }
      }
      if (!changed) break
    }
    onSplitChange(next)
  }

  const assignRemainderToPayer = () => {
    if (!canAssignToPayer || remainder === 0) return
    const next = withAllMembers.map((s) =>
      s.user_id === payerId ? { ...s, share_cents: s.share_cents + remainder } : s,
    )
    onSplitChange(next)
  }

  // Recompute equal on amount change when in equal mode
  const includedIdsKey = includedIds.join(',')
  const recomputedEqual = useMemo(
    () => distributeEqualSplit(amountCents, includedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amountCents, includedIdsKey],
  )
  const twoPersonEqual = useMemo(
    () => (members.length === 2 ? distributeEqualSplit(amountCents, memberIds) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amountCents, members.length, memberIdsKey],
  )

  // In 2-person custom split, default to equal values if split is not initialized.
  useEffect(() => {
    if (splitType !== 'custom' || members.length !== 2) return
    const hasBothMembers = split.length === 2 && memberIds.every((id) => split.some((s) => s.user_id === id))
    if (!hasBothMembers) onSplitChange(twoPersonEqual)
  }, [splitType, members.length, split, memberIds, twoPersonEqual, onSplitChange])

  return (
    <div className="space-y-3">
      <Tabs
        value={splitType}
        onValueChange={(v) => {
          onSplitTypeChange(v)
          if (v === 'equal') onSplitChange(recomputedEqual)
          if (v === 'custom' && members.length === 2) onSplitChange(twoPersonEqual)
        }}
      >
        <TabsList>
          <TabsTrigger value="equal">Equal</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="equal">
          <div className="space-y-1.5">
            {members.map((m) => {
              const mid = m.id
              const included = includedIds.includes(mid)
              const share = recomputedEqual.find((s) => s.user_id === mid)?.share_cents || 0
              return (
                <label
                  key={mid}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors',
                    included
                      ? 'bg-[var(--color-secondary)]'
                      : 'opacity-60 hover:opacity-100 hover:bg-[var(--color-secondary)]/50',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={included}
                    onChange={(e) => setIncluded(mid, e.target.checked)}
                  />
                  <div
                    className={cn(
                      'h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition',
                      included
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                        : 'border-[var(--color-border)]',
                    )}
                  >
                    {included && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-[var(--color-primary-foreground)]">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="flex-1 min-w-0 truncate">{m.display_name}</div>
                  <div className="tabular-nums text-sm text-[var(--color-muted-foreground)]">
                    {included ? formatMoney(share, currency) : '—'}
                  </div>
                </label>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <div className="space-y-1.5">
            {members.map((m) => {
              const mid = m.id
              const share = split.find((s) => s.user_id === mid)?.share_cents ?? 0
              return (
                <div
                  key={mid}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 bg-[var(--color-secondary)]"
                >
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="flex-1 min-w-0 truncate">{m.display_name}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--color-muted-foreground)]">€</span>
                    <input
                      inputMode="numeric"
                      className="h-8 w-24 bg-[var(--color-background)] rounded-md border border-[var(--color-border)] px-2 text-right tabular-nums outline-none focus:border-[var(--color-primary)]"
                      value={(share / 100).toFixed(2)}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '')
                        setCustomShare(mid, d === '' ? 0 : parseInt(d, 10))
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <RemainderBar
            remainder={remainder}
            currency={currency}
            showQuickActions={canShowQuickActions}
            canAssignToPayer={canAssignToPayer}
            onAutoFixRemainder={autoFixRemainder}
            onAssignRemainderToPayer={assignRemainderToPayer}
            onResetToEqual={resetToEqual}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RemainderBar({
  remainder,
  currency,
  showQuickActions,
  canAssignToPayer,
  onAutoFixRemainder,
  onAssignRemainderToPayer,
  onResetToEqual,
}) {
  const exact = Math.abs(remainder) < 1
  const guidance = exact
    ? 'Split is balanced. You can submit now.'
    : remainder > 0
      ? 'Allocate the remaining amount, or use a quick action below.'
      : 'Reduce shares to match the total, or use a quick action below.'
  return (
    <div className="mt-3 space-y-2">
      <div
        className={cn(
          'rounded-lg px-3 py-2 text-sm flex items-center justify-between',
          exact
            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
            : remainder > 0
              ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
              : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
        )}
      >
        <span>
          {exact
            ? '✓ Shares add up exactly'
            : remainder > 0
              ? `${formatMoney(remainder, currency)} left to assign`
              : `${formatMoney(Math.abs(remainder), currency)} over budget`}
        </span>
      </div>
      <p className="px-1 text-xs text-[var(--color-muted-foreground)]">
        {showQuickActions || exact ? guidance : guidance.replace(', or use a quick action below.', '.')}
      </p>

      {showQuickActions && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onAutoFixRemainder} disabled={exact}>
            Auto-fix remainder
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAssignRemainderToPayer}
            disabled={exact || !canAssignToPayer}
          >
            Assign remainder to payer
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onResetToEqual}>
            Reset to equal
          </Button>
        </div>
      )}
    </div>
  )
}
