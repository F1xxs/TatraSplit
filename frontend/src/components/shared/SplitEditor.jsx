import { useMemo } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'

// Distributes amount_cents evenly across included members with deterministic remainder.
export function distributeEqual(amountCents, memberIds) {
  const n = memberIds.length
  if (n === 0) return []
  const base = Math.floor(amountCents / n)
  const rem = amountCents - base * n
  return memberIds.map((id, i) => ({
    user_id: id,
    share_cents: base + (i < rem ? 1 : 0),
  }))
}

export function SplitEditor({
  members,
  amountCents,
  currency = 'EUR',
  splitType,
  onSplitTypeChange,
  split,
  onSplitChange,
}) {
  const includedIds = split.map((s) => s.user_id)
  const sum = split.reduce((a, s) => a + (s.share_cents || 0), 0)
  const remainder = amountCents - sum

  const setIncluded = (id, included) => {
    let next
    if (included) {
      const ids = [...includedIds, id]
      next = distributeEqual(amountCents, ids)
    } else {
      const ids = includedIds.filter((x) => x !== id)
      next = distributeEqual(amountCents, ids)
    }
    onSplitChange(next)
  }

  const setCustomShare = (id, cents) => {
    const existing = split.find((s) => s.user_id === id)
    let next
    if (!existing) {
      next = [...split, { user_id: id, share_cents: cents }]
    } else {
      next = split.map((s) => (s.user_id === id ? { ...s, share_cents: cents } : s))
    }
    onSplitChange(next)
  }

  // Recompute equal on amount change when in equal mode
  const recomputedEqual = useMemo(
    () => distributeEqual(amountCents, includedIds),
    [amountCents, includedIds.join(',')],
  )

  return (
    <div className="space-y-3">
      <Tabs
        value={splitType}
        onValueChange={(v) => {
          onSplitTypeChange(v)
          if (v === 'equal') onSplitChange(recomputedEqual)
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

          <RemainderBar remainder={remainder} currency={currency} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RemainderBar({ remainder, currency }) {
  const exact = Math.abs(remainder) < 1
  return (
    <div
      className={cn(
        'mt-3 rounded-lg px-3 py-2 text-sm flex items-center justify-between',
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
  )
}
