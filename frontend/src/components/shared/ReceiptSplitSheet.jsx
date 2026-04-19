import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAddExpense } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

function computeSplit(items, assignments) {
  const totals = {}
  items.forEach((item, idx) => {
    const set = assignments[idx]
    if (!set || set.size === 0) return
    const arr = [...set]
    const base = Math.floor(item.amount_cents / arr.length)
    const rem = item.amount_cents - base * arr.length
    arr.forEach((uid, i) => {
      totals[uid] = (totals[uid] || 0) + base + (i < rem ? 1 : 0)
    })
  })
  return Object.entries(totals).map(([user_id, share_cents]) => ({ user_id, share_cents }))
}

export function ReceiptSplitSheet({ open, onOpenChange, receipt, members, groupId, paidBy, onSuccess }) {
  const { toast } = useToast()
  const addExpense = useAddExpense(groupId)
  const [assignments, setAssignments] = useState([])

  useEffect(() => {
    if (open && receipt) {
      setAssignments(receipt.items.map(() => new Set()))
    }
  }, [open, receipt])

  if (!receipt) return null

  const toggle = (itemIdx, userId) => {
    setAssignments((prev) => {
      const next = prev.map((s) => new Set(s))
      if (next[itemIdx].has(userId)) next[itemIdx].delete(userId)
      else next[itemIdx].add(userId)
      return next
    })
  }

  const assignAll = (itemIdx) => {
    setAssignments((prev) => {
      const next = prev.map((s) => new Set(s))
      next[itemIdx] = new Set(members.map((m) => m.id))
      return next
    })
  }

  const customSplit = computeSplit(receipt.items, assignments)
  const totalCents = customSplit.reduce((a, s) => a + s.share_cents, 0)
  const unassignedCount = assignments.filter((s) => s && s.size === 0).length
  const canSubmit = customSplit.length > 0 && !addExpense.isPending

  const handleConfirm = async () => {
    try {
      await addExpense.mutateAsync({
        description: receipt.description || 'Receipt',
        category: 'food',
        amount_cents: totalCents,
        currency: receipt.currency || 'EUR',
        paid_by: paidBy,
        split_type: 'custom',
        custom_split: customSplit,
      })
      toast({ variant: 'success', title: 'Expense added from receipt' })
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast({ variant: 'error', title: 'Could not save expense', description: err.message })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} zIndex={100}>
      <SheetHeader>
        <SheetTitle>Split receipt</SheetTitle>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          {receipt.description} · {formatMoney(receipt.amount_cents, receipt.currency)}
        </p>
      </SheetHeader>

      <SheetContent className="space-y-3">
        {/* Per-person totals */}
        {customSplit.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl bg-[var(--color-secondary)] px-3 py-2.5">
            {customSplit.map(({ user_id, share_cents }) => {
              const m = members.find((x) => x.id === user_id)
              return (
                <div key={user_id} className="flex items-center gap-1.5 text-xs">
                  <Avatar name={m?.display_name} color={m?.color} size="xs" />
                  <span className="font-semibold tabular-nums">
                    {formatMoney(share_cents, receipt.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Unassigned warning */}
        {unassignedCount > 0 && (
          <div className="rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-3 py-2 text-xs">
            {unassignedCount} item{unassignedCount > 1 ? 's' : ''} unassigned — {unassignedCount > 1 ? 'they' : 'it'} won't be included
          </div>
        )}

        {/* Line items */}
        {receipt.items.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-[var(--color-border)] p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{item.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="tabular-nums text-sm text-[var(--color-muted-foreground)]">
                  {formatMoney(item.amount_cents, receipt.currency)}
                </span>
                {assignments[idx]?.size !== members.length && (
                  <button
                    type="button"
                    onClick={() => assignAll(idx)}
                    className="text-[10px] text-[var(--color-primary)] font-medium hover:underline"
                  >
                    All
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const assigned = assignments[idx]?.has(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(idx, m.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all',
                      assigned
                        ? 'bg-[var(--color-primary)]/15 ring-1 ring-[var(--color-primary)]'
                        : 'bg-[var(--color-secondary)] opacity-50 hover:opacity-80',
                    )}
                  >
                    <Avatar name={m.display_name} color={m.color} size="sm" />
                    <span className="text-[10px] font-medium max-w-[48px] truncate">
                      {m.display_name?.split(' ')[0] || m.handle}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </SheetContent>

      <SheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={!canSubmit}>
          {addExpense.isPending
            ? 'Saving…'
            : `Add ${formatMoney(totalCents, receipt.currency)}`}
        </Button>
      </SheetFooter>
    </Sheet>
  )
}
