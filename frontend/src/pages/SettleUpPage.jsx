import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import { useGroup, useGroupBalances } from '@/hooks/useGroups'
import { useToast } from '@/components/ui/toaster'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SettleUpPage() {
  const { id } = useParams()
  const { data: group } = useGroup(id)
  const { data: balances, isLoading } = useGroupBalances(id)
  const { toast } = useToast()

  const members = group?.members || []
  const byId = (uid) => members.find((m) => (m.id || m._id) === uid)
  const transfers = balances?.simplified_transfers || []

  const markPaid = () => {
    toast({
      variant: 'error',
      title: 'Not available in demo',
      description: 'Real payments are disabled in this demo.',
    })
  }

  return (
    <div className="space-y-4">
      <Link
        to={`/groups/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {group?.name || 'group'}
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
          ⚡
        </div>
        <div>
          <h1 className="text-lg font-semibold">Settle up</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Minimum transfers to square everyone up
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : transfers.length === 0 ? (
          <AllSettled />
        ) : (
          <div>
            {transfers.map((t, idx) => {
              const from = byId(t.from_user)
              const to = byId(t.to_user)
              return (
                <div key={idx} className={idx > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                  <TransferRow
                    from={from}
                    to={to}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    onMarkPaid={markPaid}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TransferRow({ from, to, amountCents, currency, onMarkPaid }) {
  return (
    <div className="p-4 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={from?.display_name} color={from?.color} size="md" />
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">owes</div>
          <div className="text-sm font-semibold truncate">{from?.display_name}</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 shrink-0 mx-2">
        <ArrowRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <div className="text-sm font-bold tabular-nums" style={{ color: '#E84040' }}>
          {formatMoney(amountCents, currency)}
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar name={to?.display_name} color={to?.color} size="md" />
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">gets</div>
          <div className="text-sm font-semibold truncate">{to?.display_name}</div>
        </div>
      </div>

      <button
        onClick={onMarkPaid}
        className={cn(
          'ml-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
          'bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25',
        )}
      >
        <Check className="h-4 w-4" />
        Mark paid
      </button>
    </div>
  )
}

function AllSettled() {
  return (
    <div className="text-center py-14">
      <div className="mx-auto h-16 w-16 rounded-full bg-[#1DB954]/15 flex items-center justify-center text-3xl">
        ✓
      </div>
      <div className="mt-4 text-lg font-semibold">All settled up</div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        No transfers needed.
      </p>
    </div>
  )
}
