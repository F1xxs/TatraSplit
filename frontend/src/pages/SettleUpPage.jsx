import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Coins, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import { useGroup, useGroupBalances } from '@/hooks/useGroups'
import { useMe } from '@/hooks/useMe'
import { useSettle } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SettleUpPage() {
  const { id } = useParams()
  const { data: group } = useGroup(id)
  const { data: balances, isLoading } = useGroupBalances(id)
  const { data: me } = useMe()
  const settle = useSettle(id)
  const { toast } = useToast()

  const members = group?.members || []
  const byId = (uid) => members.find((m) => (m.id || m._id) === uid)
  const transfers = balances?.simplified_transfers || []

  const meId = me?.id || me?._id
  const youOwe = transfers.filter((t) => t.from_user === meId)
  const youAreOwed = transfers.filter((t) => t.to_user === meId)
  const others = transfers.filter((t) => t.from_user !== meId && t.to_user !== meId)

  const handleMarkPaid = (t) => {
    settle.mutate(
      {
        from_user: t.from_user,
        to_user: t.to_user,
        amount_cents: t.amount_cents,
        currency: group?.currency || 'EUR',
        method: 'manual',
      },
      {
        onSuccess: () => toast({ title: 'Marked as paid', description: 'Settlement recorded.' }),
        onError: () => toast({ variant: 'error', title: 'Failed', description: 'Could not record settlement.' }),
      },
    )
  }

  const handlePay = () => {
    toast({
      title: 'Bank transfer',
      description: 'Direct bank payment coming soon — TatraBank integration planned.',
    })
  }

  const allSettled = !isLoading && transfers.length === 0

  return (
    <div className="space-y-4">
      <Link
        to={`/groups/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-(--color-foreground)"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {group?.name || 'group'}
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-(--color-primary)/15 text-(--color-primary) flex items-center justify-center">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Settle up</h1>
          <p className="text-xs text-muted-foreground">Minimum transfers to square everyone up</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : allSettled ? (
        <AllSettled />
      ) : (
        <div className="space-y-5">
          {youOwe.length > 0 && (
            <Section label="You owe" labelColor="text-[#E84040]">
              {youOwe.map((t, idx) => (
                <Row key={idx} first={idx === 0}>
                  <TransferCard
                    from={byId(t.from_user)}
                    to={byId(t.to_user)}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    amountColor="#E84040"
                    onMarkPaid={() => handleMarkPaid(t)}
                    onPay={handlePay}
                    isPending={settle.isPending}
                    showPay
                  />
                </Row>
              ))}
            </Section>
          )}

          {youAreOwed.length > 0 && (
            <Section label="You are owed" labelColor="text-[#1DB954]">
              {youAreOwed.map((t, idx) => (
                <Row key={idx} first={idx === 0}>
                  <TransferCard
                    from={byId(t.from_user)}
                    to={byId(t.to_user)}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    amountColor="#1DB954"
                    onMarkPaid={() => handleMarkPaid(t)}
                    isPending={settle.isPending}
                  />
                </Row>
              ))}
            </Section>
          )}

          {others.length > 0 && (
            <Section label="Other transfers" labelColor="text-muted-foreground">
              {others.map((t, idx) => (
                <Row key={idx} first={idx === 0}>
                  <OtherRow
                    from={byId(t.from_user)}
                    to={byId(t.to_user)}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                  />
                </Row>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, labelColor, children }) {
  return (
    <section className="space-y-2">
      <h2 className={cn('text-xs font-semibold uppercase tracking-widest px-1', labelColor)}>
        {label}
      </h2>
      <div className="rounded-2xl border border-(--color-border) bg-(--color-card) overflow-hidden">
        {children}
      </div>
    </section>
  )
}

function Row({ first, children }) {
  return (
    <div className={first ? '' : 'border-t border-(--color-border)'}>
      {children}
    </div>
  )
}

function TransferCard({ from, to, amountCents, currency, amountColor, onMarkPaid, onPay, isPending, showPay }) {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={from?.display_name} color={from?.color} size="md" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">from</div>
            <div className="text-sm font-semibold leading-tight break-words whitespace-normal">{from?.display_name}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
          <ArrowRight className="h-4 w-4" style={{ color: amountColor }} />
          <div className="text-sm font-bold tabular-nums whitespace-nowrap" style={{ color: amountColor }}>
            {formatMoney(amountCents, currency)}
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0 justify-self-end w-full">
          <Avatar name={to?.display_name} color={to?.color} size="md" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">to</div>
            <div className="text-sm font-semibold leading-tight break-words whitespace-normal">{to?.display_name}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onMarkPaid}
          disabled={isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            'bg-(--color-muted)/40 text-(--color-foreground) hover:bg-(--color-muted)/60 disabled:opacity-50',
          )}
        >
          <Check className="h-4 w-4" />
          Mark as paid
        </button>
        {showPay && (
          <button
            onClick={onPay}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              'bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/90',
            )}
          >
            <Zap className="h-4 w-4" />
            Pay now
          </button>
        )}
      </div>
    </div>
  )
}

function OtherRow({ from, to, amountCents, currency }) {
  return (
    <div className="p-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 opacity-60">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={from?.display_name} color={from?.color} size="sm" />
        <div className="min-w-0 text-xs text-muted-foreground leading-tight break-words whitespace-normal">{from?.display_name}</div>
      </div>
      <div className="flex flex-col items-center gap-0.5 shrink-0 mx-1">
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <div className="text-xs font-semibold tabular-nums text-muted-foreground whitespace-nowrap">
          {formatMoney(amountCents, currency)}
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-0 justify-self-end w-full">
        <Avatar name={to?.display_name} color={to?.color} size="sm" />
        <div className="min-w-0 text-xs text-muted-foreground leading-tight break-words whitespace-normal">{to?.display_name}</div>
      </div>
    </div>
  )
}

function AllSettled() {
  return (
    <div className="text-center py-14 rounded-2xl border border-(--color-border) bg-(--color-card)">
      <div className="mx-auto h-16 w-16 rounded-full bg-[#1DB954]/15 flex items-center justify-center text-3xl">
        ✓
      </div>
      <div className="mt-4 text-lg font-semibold">All settled up</div>
      <p className="mt-1 text-sm text-muted-foreground">No transfers needed.</p>
    </div>
  )
}
