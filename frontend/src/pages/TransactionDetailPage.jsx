import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Receipt, Repeat, RotateCcw, Share2, Users } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { useActivity, useUsers } from '@/hooks/useGroups'
import { useMe } from '@/hooks/useMe'
import { formatMoney } from '@/lib/format'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { AddToGroupSheet } from '@/components/shared/ActivityItem'

export function TransactionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { data: items = [], isLoading } = useActivity()
  const { data: me } = useMe()
  const { data: users = [] } = useUsers()
  const [addToGroupOpen, setAddToGroupOpen] = useState(false)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)

  const meId = me?.id

  // When navigating from payment completion, data arrives via location.state
  const statePayload = id === 'receipt' ? location.state : null
  const item = statePayload
    ? {
        id: 'receipt',
        kind: 'settlement.created',
        created_at: statePayload.created_at,
        actor_id: statePayload.from_user,
        payload: {
          from_name: statePayload.from_name,
          to_name: statePayload.to_name,
          from_user: statePayload.from_user,
          to_user: statePayload.to_user,
          amount_cents: statePayload.amount_cents,
          currency: statePayload.currency,
          settlement_id: statePayload.settlement_id,
          shared: false,
          shared_group_id: statePayload.group_id || null,
          group_name: null,
        },
      }
    : items.find((i) => i.id === id)

  if (isLoading && !item) {
    return (
      <div className="space-y-4">
        <BackBtn onBack={() => navigate(-1)} />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    )
  }

  if (!item || item.kind !== 'settlement.created') {
    return (
      <div className="space-y-4">
        <BackBtn onBack={() => navigate(-1)} />
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">
          Transaction not found.
        </div>
      </div>
    )
  }

  const { payload } = item
  const isSent = payload.from_user === meId
  const fromUser = users.find((u) => u.id === payload.from_user)
  const toUser = users.find((u) => u.id === payload.to_user)
  const ts = item.created_at ? new Date(item.created_at) : new Date()
  const isShared = payload.shared === true
  const canAddToGroup = !isShared && isSent
  const refCode = payload.settlement_id
    ? payload.settlement_id.slice(-8).toUpperCase()
    : id.slice(-8).toUpperCase()

  function handleAgain() {
    if (isSent) {
      const params = new URLSearchParams({
        to: payload.to_name || '',
        toUser: payload.to_user || '',
        amount: String(payload.amount_cents || 0),
      })
      navigate(`/payment?${params}`)
    } else {
      navigate('/payment')
    }
  }

  function handleCheck() {
    if (payload.shared_group_id) {
      navigate(`/groups/${payload.shared_group_id}`)
    } else {
      navigate('/activity')
    }
  }

  function handleRecurring() {
    if (payload.shared_group_id) {
      navigate(`/groups/${payload.shared_group_id}`)
    } else {
      toast({ title: 'Recurring', description: 'Add to a group first to set up recurring payments.' })
    }
  }

  function handleAddToGroup() {
    if (canAddToGroup) {
      setAddToGroupOpen(true)
    } else {
      toast({ title: 'Already split', description: 'This payment has already been added to a group.' })
    }
  }

  const quickActions = [
    { label: 'Share', Icon: Share2, action: () => setShareSheetOpen(true) },
    { label: 'Again', Icon: RotateCcw, action: handleAgain },
    { label: 'Check', Icon: Receipt, action: handleCheck },
    { label: 'Recurring', Icon: Repeat, action: handleRecurring },
    { label: 'Split', Icon: Users, action: handleAddToGroup, muted: isShared },
  ]

  return (
    <div className="space-y-4">
      <BackBtn onBack={() => navigate(-1)} />

      {/* Hero */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30">
            <CheckCircle2 className="h-9 w-9 text-[#1DB954]" />
          </div>

          <h1 className="text-xl font-semibold">
            {isSent ? 'Payment sent' : 'Payment received'}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Avatar name={payload.from_name} color={fromUser?.color} size="md" />
              <span className="text-xs text-[var(--color-muted-foreground)] max-w-[72px] truncate">
                {payload.from_name}
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--color-muted-foreground)] shrink-0" />
            <div className="flex flex-col items-center gap-1">
              <Avatar name={payload.to_name} color={toUser?.color} size="md" />
              <span className="text-xs text-[var(--color-muted-foreground)] max-w-[72px] truncate">
                {payload.to_name}
              </span>
            </div>
          </div>

          <div className="text-4xl font-bold tabular-nums">
            {formatMoney(payload.amount_cents, payload.currency || 'EUR')}
          </div>

          <p className="text-sm text-[var(--color-muted-foreground)]">
            {isSent
              ? `To ${payload.to_name} · ${format(ts, 'd MMM, HH:mm')}`
              : `From ${payload.from_name} · ${format(ts, 'd MMM, HH:mm')}`}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4">
        <div className="flex items-start justify-around gap-1">
          {quickActions.map(({ label, Icon, action, muted }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={action}
                className={cn(
                  'w-14 h-14 rounded-full border flex items-center justify-center transition-colors',
                  muted
                    ? 'bg-[var(--color-card-elevated)] border-[var(--color-border)] opacity-40 cursor-default'
                    : 'bg-[var(--color-card-elevated)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]',
                )}
              >
                <Icon className="h-5 w-5 text-[var(--color-foreground)]" />
              </button>
              <span className="text-[10px] text-[var(--color-muted-foreground)] text-center leading-tight max-w-[56px]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-4 space-y-3">
        <DetailsRow label="Reference" value={`REF-${refCode}`} mono />
        <DetailsRow label="Status" value={isShared ? 'Settled' : 'Completed'} />
        <DetailsRow label="Date" value={format(ts, 'd MMM yyyy, HH:mm')} />
        <DetailsRow label="Method" value="In-app transfer" />
        {payload.group_name && <DetailsRow label="Group" value={payload.group_name} />}
      </div>

      {/* Bottom */}
      <div className="space-y-2 pb-4">
        {payload.shared_group_id && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/groups/${payload.shared_group_id}`)}
          >
            Open group
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={() => navigate('/activity')}>
          Back to activity
        </Button>
      </div>

      {/* Share with person sheet */}
      <ShareWithPersonSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        users={users.filter((u) => u.id !== meId)}
        payload={payload}
      />

      {/* Add to group sheet */}
      <AddToGroupSheet open={addToGroupOpen} onOpenChange={setAddToGroupOpen} item={item} meId={meId} />
    </div>
  )
}

function ShareWithPersonSheet({ open, onOpenChange, users, payload }) {
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.display_name?.toLowerCase().includes(q) || u.handle?.toLowerCase().includes(q)
  })

  function handleShare(user) {
    onOpenChange(false)
    setSearch('')
    toast({
      title: 'Shared',
      description: `Payment details shared with ${user.display_name || user.handle}.`,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
      <SheetContent className="rounded-t-2xl pb-safe">
        <SheetHeader className="mb-4">
          <SheetTitle>Share with person</SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {/* Summary */}
          <div className="rounded-2xl bg-[var(--color-secondary)] p-3 text-center">
            <div className="text-xl font-bold tabular-nums">
              {formatMoney(payload?.amount_cents, payload?.currency || 'EUR')}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {payload?.from_name} → {payload?.to_name}
            </div>
          </div>

          <Input
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                No people found
              </div>
            )}
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleShare(u)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--color-secondary)] transition-colors text-left"
              >
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                  style={{ background: u.color || '#0070D2' }}
                >
                  {(u.display_name || u.handle || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{u.display_name || u.handle}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">{u.handle}</div>
                </div>
              </button>
            ))}
          </div>

          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BackBtn({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-(--color-foreground)"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  )
}

function DetailsRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
      <span className={cn('text-sm font-medium text-right', mono && 'font-semibold tabular-nums')}>
        {value}
      </span>
    </div>
  )
}
