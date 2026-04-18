import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Coins } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [confirmPayTransfer, setConfirmPayTransfer] = useState(null)

  const members = group?.members || []
  const byId = (uid) => members.find((m) => (m.id || m._id) === uid)
  const transfers = balances?.simplified_transfers || []

  const meId = me?.id || me?._id
  const relatedTransfers = transfers.filter((t) => t.from_user === meId || t.to_user === meId)
  const youOwe = transfers.filter((t) => t.from_user === meId)
  const youAreOwed = transfers.filter((t) => t.to_user === meId)

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

  const handleConfirmPay = (t) => {
    setConfirmPayTransfer(t)
  }

  const handlePay = () => {
    if (!confirmPayTransfer) return
    settle.mutate(
      {
        from_user: confirmPayTransfer.from_user,
        to_user: confirmPayTransfer.to_user,
        amount_cents: confirmPayTransfer.amount_cents,
        currency: group?.currency || 'EUR',
        method: 'manual',
      },
      {
        onSuccess: () => {
          toast({ title: 'Payment recorded', description: 'The transfer was marked as paid.' })
          setConfirmPayTransfer(null)
        },
        onError: () => toast({ variant: 'error', title: 'Failed', description: 'Could not record payment.' }),
      },
    )
  }

  const allSettled = !isLoading && relatedTransfers.length === 0

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
            <Section label="YOU OWE" labelColor="text-[#E84040]">
              {youOwe.map((t, idx) => (
                <Row key={idx}>
                  <TransferCard
                    from={byId(t.from_user)}
                    to={byId(t.to_user)}
                    amountCents={t.amount_cents}
                    currency={group?.currency || 'EUR'}
                    amountColor="#E84040"
                    onAction={() => handleConfirmPay(t)}
                    isPending={settle.isPending}
                    actionLabel="Pay"
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
        </div>
      )}

      <Dialog
        open={!!confirmPayTransfer}
        onOpenChange={(open) => !open && setConfirmPayTransfer(null)}
      >
        <DialogContent onClose={() => setConfirmPayTransfer(null)}>
          <DialogHeader>
            <DialogTitle>Confirm payment</DialogTitle>
            <DialogDescription>
              {confirmPayTransfer
                ? `Pay ${formatMoney(confirmPayTransfer.amount_cents, group?.currency || 'EUR')} to ${byId(confirmPayTransfer.to_user)?.display_name || 'this member'}?`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmPayTransfer(null)}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={settle.isPending}
              className="rounded-full bg-[#E84040] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d13434] disabled:opacity-50"
            >
              Confirm pay
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <div className="text-center py-14 rounded-2xl border border-(--color-border) bg-(--color-card)">
      <div className="mx-auto h-16 w-16 rounded-full bg-[#1DB954]/15 flex items-center justify-center text-3xl">
        ✓
      </div>
      <div className="mt-4 text-lg font-semibold">All settled up</div>
      <p className="mt-1 text-sm text-muted-foreground">No transfers needed.</p>
    </div>
  )
}
