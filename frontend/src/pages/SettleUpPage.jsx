import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toaster'
import { useGroup, useGroupBalances, useGroupSettlements } from '@/hooks/useGroups'
import { useMe } from '@/hooks/useMe'
import { useSettle } from '@/hooks/useMutations'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Check, Coins, Clock } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'

export function SettleUpPage() {
  const { id } = useParams()
  const { data: group } = useGroup(id)
  const { data: balances, isLoading } = useGroupBalances(id)
  const { data: settlements = [] } = useGroupSettlements(id)
  const { data: me } = useMe()
  const settle = useSettle(id)
  const { toast } = useToast()
  const navigate = useNavigate()

  const members = group?.members || []
  const byId = (uid) => members.find((m) => m.id === uid)
  const transfers = balances?.simplified_transfers || []

  const meId = me?.id
  const relatedTransfers = transfers.filter((t) => t.from_user === meId || t.to_user === meId)
  const youOwe = transfers.filter((t) => t.from_user === meId)
  const youAreOwed = transfers.filter((t) => t.to_user === meId)
  const othersPending = transfers.filter((t) => t.from_user !== meId && t.to_user !== meId)
  const completed = [...settlements].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )

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

  const handlePayInApp = (t) => {
    const to = byId(t.to_user)
    const params = new URLSearchParams()
    if (to?.handle) params.set('to', to.handle)
    params.set('toUser', t.to_user)
    params.set('amount', String(t.amount_cents))
    params.set('groupId', String(id))
    navigate(`/payment?${params.toString()}`)
  }

  const noRelated = !isLoading && relatedTransfers.length === 0

  return (
    <div className="space-y-4">
      <Link
        to={`/groups/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-(--color-foreground)"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
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
      ) : (
        <div className="space-y-5">
          {noRelated && <AllSettled />}

          {youOwe.length > 0 && (
            <Section label="YOU OWE" labelColor="text-[#E84040]">
              {youOwe.map((t, idx) => (
                <Row key={idx}>
                    <TransferCard
                      from={byId(t.from_user)}
                      to={byId(t.to_user)}
                      amountCents={t.amount_cents}
                      currency={group?.currency || 'EUR'}
                      amountColor="#E84040"
                      onAction={() => handlePayInApp(t)}
                      isPending={false}
                      actionLabel="Pay in app"
                      actionVariant="danger"
                    />
                  </Row>
                ))}
              </Section>
          )}

          {youAreOwed.length > 0 && (
            <Section label="You are owed" labelColor="text-muted-foreground">
              {youAreOwed.map((t, idx) => (
                <Row key={idx}>
                  <TransferCard
                    from={byId(t.from_user)}
                    to={byId(t.to_user)}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    amountColor="#1DB954"
                    onAction={() => handleMarkPaid(t)}
                    isPending={settle.isPending}
                    actionLabel="Mark as paid"
                    actionVariant="primary"
                  />
                </Row>
              ))}
            </Section>
          )}

          {othersPending.length > 0 && (
            <Section label="Others — pending" labelColor="text-muted-foreground">
              {othersPending.map((t, idx) => (
                <Row key={idx}>
                  <StatusTransferRow
                    from={byId(t.from_user)}
                    to={byId(t.to_user)}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    status="pending"
                  />
                </Row>
              ))}
            </Section>
          )}

          {completed.length > 0 && (
            <Section label="Completed" labelColor="text-muted-foreground">
              {completed.map((s) => (
                <Row key={s.id}>
                  <StatusTransferRow
                    from={byId(s.from_user)}
                    to={byId(s.to_user)}
                    amountCents={s.amount_cents}
                    currency={s.currency || group?.currency || 'EUR'}
                    status="completed"
                    date={s.created_at}
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
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Row({ children }) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-card) shadow-[0_8px_22px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  )
}

function TransferCard({
  from,
  to,
  amountCents,
  currency,
  amountColor,
  onAction,
  isPending,
  actionLabel,
  actionVariant,
}) {
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
          onClick={onAction}
          disabled={isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            actionVariant === 'danger'
              ? 'bg-[#E84040] text-white hover:bg-[#d13434] disabled:opacity-50'
              : 'bg-[#0a74b8] text-white hover:bg-[#0969a6] disabled:opacity-50',
          )}
        >
          <Check className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

function AllSettled() {
  return (
    <div className="text-center py-10 rounded-2xl border border-(--color-border) bg-(--color-card)">
      <div className="mx-auto h-14 w-14 rounded-full bg-[#1DB954]/15 flex items-center justify-center text-2xl">
        ✓
      </div>
      <div className="mt-3 text-base font-semibold">You're all settled up</div>
      <p className="mt-1 text-xs text-muted-foreground">Nothing owed between you and the group.</p>
    </div>
  )
}

function StatusTransferRow({ from, to, amountCents, currency, status, date }) {
  const completed = status === 'completed'
  const badgeColor = completed ? '#1DB954' : '#F59E0B'
  const badgeIcon = completed ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />
  const badgeText = completed ? 'Completed' : 'Pending'

  return (
    <div className="p-4 space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={from?.display_name} color={from?.color} size="md" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">from</div>
            <div className="text-sm font-semibold leading-tight whitespace-normal wrap-break-word">
              {from?.display_name}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
          <ArrowRight className="h-4 w-4" style={{ color: badgeColor }} />
          <div
            className="text-sm font-bold tabular-nums whitespace-nowrap"
            style={{ color: badgeColor }}
          >
            {formatMoney(amountCents, currency)}
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0 justify-self-end w-full">
          <Avatar name={to?.display_name} color={to?.color} size="md" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">to</div>
            <div className="text-sm font-semibold leading-tight whitespace-normal wrap-break-word">
              {to?.display_name}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: badgeColor + '22', color: badgeColor }}
        >
          {badgeIcon}
          {badgeText}
        </div>
        {date && (
          <div className="text-[11px] text-muted-foreground tabular-nums">
            {format(new Date(date), 'dd MMM yyyy HH:mm')}
          </div>
        )}
      </div>
    </div>
  )
}
