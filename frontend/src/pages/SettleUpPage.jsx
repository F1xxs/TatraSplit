import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import { useGroup, useGroupBalances } from '@/hooks/useGroups'
import { useSettle } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SettleUpPage() {
  const { id } = useParams()
  const { data: group } = useGroup(id)
  const { data: balances, isLoading } = useGroupBalances(id)
  const settle = useSettle(id)
  const { toast } = useToast()
  const [pending, setPending] = useState(new Set())
  const [done, setDone] = useState(new Set())

  const members = group?.members || []
  const byId = (uid) => members.find((m) => (m.id || m._id) === uid)

  const transfers = balances?.simplified_transfers || []
  const visibleTransfers = transfers.filter((_, i) => !done.has(i))

  const markPaid = async (idx, t) => {
    const key = idx
    setPending((p) => new Set(p).add(key))
    try {
      await settle.mutateAsync({
        from_user: t.from_user,
        to_user: t.to_user,
        amount_cents: t.amount_cents,
        method: 'mock_transfer',
      })
      setDone((d) => new Set(d).add(key))
      toast({
        variant: 'success',
        title: 'Marked as paid',
        description: `${formatMoney(t.amount_cents, group?.currency || 'EUR')} settled`,
      })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not settle', description: err.message })
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(key)
        return n
      })
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/groups/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {group?.name || 'group'}
      </Link>

      <Card elevated>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Settle up</CardTitle>
              <CardDescription>
                The minimum transfers to square everyone up
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : visibleTransfers.length === 0 ? (
            <AllSettled />
          ) : (
            <div className="space-y-3">
              {transfers.map((t, idx) => {
                if (done.has(idx)) return null
                const from = byId(t.from_user)
                const to = byId(t.to_user)
                return (
                  <TransferRow
                    key={idx}
                    from={from}
                    to={to}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    onMarkPaid={() => markPaid(idx, t)}
                    pending={pending.has(idx)}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TransferRow({ from, to, amountCents, currency, onMarkPaid, pending }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-4 transition-all',
        'hover:border-[var(--color-primary)]/40',
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <PersonBlock person={from} subtitle="owes" />
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <ArrowRight className="h-5 w-5 text-[var(--color-muted-foreground)]" />
            <div className="text-base font-semibold tabular-nums">
              {formatMoney(amountCents, currency)}
            </div>
          </div>
          <PersonBlock person={to} subtitle="gets" rightAlign />
        </div>
        <Button
          onClick={onMarkPaid}
          disabled={pending}
          variant="success"
          className="ml-auto"
        >
          {pending ? (
            'Settling…'
          ) : (
            <>
              <Check className="h-4 w-4" />
              Mark paid
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function PersonBlock({ person, subtitle, rightAlign = false }) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', rightAlign && 'flex-row-reverse text-right')}>
      <Avatar name={person?.display_name} color={person?.color} size="md" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {subtitle}
        </div>
        <div className="font-semibold truncate">{person?.display_name}</div>
      </div>
    </div>
  )
}

function AllSettled() {
  return (
    <div className="text-center py-10">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center justify-center text-3xl">
        🎉
      </div>
      <div className="mt-4 text-lg font-semibold">Everyone's settled up</div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        No transfers needed. Enjoy your day.
      </p>
    </div>
  )
}
