import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Receipt, HandCoins, UserPlus, Users, Bell, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMe } from '@/hooks/useMe'
import { useGroups, useUsers } from '@/hooks/useGroups'
import { useCreateGroup } from '@/hooks/useMutations'
import { api } from '@/lib/api'
import { invalidateGlobal } from '@/lib/invalidation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toaster'
import { AddExpenseSheet } from '@/pages/AddExpensePage'

const kindMeta = {
  'expense.created':    { icon: Receipt,   color: '#0070D2' },
  'expense.deleted':    { icon: Trash2,    color: '#E84040' },
  'settlement.created': { icon: HandCoins, color: '#1DB954' },
  'group.created':      { icon: Users,     color: '#0070D2' },
  'member.joined':      { icon: UserPlus,  color: '#0070D2' },
  'reminder.sent':      { icon: Bell,      color: '#F59E0B' },
  'jar.contributed':    { icon: Receipt,   color: '#F59E0B' },
  'jar.withdrawn':      { icon: HandCoins, color: '#1DB954' },
}

function getTitle(item, meId) {
  switch (item.kind) {
    case 'expense.created':   return item.payload?.description || 'Expense'
    case 'expense.deleted':   return item.payload?.description || 'Expense deleted'
    case 'settlement.created': {
      const fromName = item.payload?.from_name || 'someone'
      const toName = item.payload?.to_name || 'someone'
      if (item.payload?.to_user && meId && item.payload.to_user === meId) {
        return `Received from ${fromName}`
      }
      if (item.payload?.from_user && meId && item.payload.from_user === meId) {
        return `Payment to ${toName}`
      }
      return `${fromName} paid ${toName}`
    }
    case 'group.created':     return item.payload?.group_name || 'New group'
    case 'member.joined':     return `${item.payload?.actor_name || 'Someone'} joined`
    case 'jar.contributed':   return `Contributed to ${item.payload?.group_name || 'Moneybox'}`
    case 'jar.withdrawn':     return 'Withdrew from Moneybox'
    default: return item.kind
  }
}

function getSubtitle(item, meId) {
  const group = item.payload?.group_name
  switch (item.kind) {
    case 'expense.created':
      return group || ''
    case 'settlement.created': {
      const isReceiver = item.payload?.to_user && meId && item.payload.to_user === meId
      const label = isReceiver ? 'Payment received' : 'Payment sent'
      return `${label}${group ? ` · ${group}` : ''}`
    }
    case 'group.created':
      return 'Group created'
    case 'member.joined':
      return group || 'Joined group'
    case 'jar.contributed':
      return 'Deposit · ' + (group || 'Shared fund')
    case 'jar.withdrawn':
      return 'Withdrawal · ' + (group || 'Moneybox')
    default: return group || ''
  }
}

function getAmount(item, meId) {
  if (item.payload?.amount_cents == null) return null
  const amt = item.payload.amount_cents
  const currency = item.payload?.currency || 'EUR'
  let isCredit = true
  if (item.kind === 'settlement.created') {
    if (item.payload?.from_user && meId && item.payload.from_user === meId) {
      isCredit = false
    } else {
      isCredit = true
    }
  } else if (item.kind === 'expense.created') {
    isCredit = false
  } else if (item.kind === 'jar.contributed') {
    isCredit = false  // money leaving your pocket
  } else if (item.kind === 'jar.withdrawn') {
    isCredit = true   // money coming to your account
  }
  return { amt, currency, isCredit }
}

export function ActivityItem({ item, className }) {
  const { data: me } = useMe()
  const meId = me?.id
  const meta = kindMeta[item.kind] || kindMeta['expense.created']
  const Icon = meta.icon
  const amount = getAmount(item, meId)

  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: meta.color + '22' }}
      >
        <Icon className="h-5 w-5" style={{ color: meta.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{getTitle(item, meId)}</div>
        <div className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
          {getSubtitle(item, meId)}
        </div>
      </div>
      {amount && (
        <div
          className={cn(
            'text-sm font-semibold tabular-nums shrink-0',
            amount.isCredit ? 'text-[#1DB954]' : 'text-[#E84040]',
          )}
        >
          {amount.isCredit ? '+' : '−'}{formatMoney(amount.amt, amount.currency)}
        </div>
      )}
    </div>
  )
}

/* Bank-style transaction row used in Dashboard and ActivityPage */
export function BankTransactionRow({ item, border, dateLabel }) {
  const { data: me } = useMe()
  const meId = me?.id
  const navigate = useNavigate()
  const meta = kindMeta[item.kind] || kindMeta['expense.created']
  const Icon = meta.icon
  const ts = item.created_at ? new Date(item.created_at) : new Date()
  const amount = getAmount(item, meId)

  const isSettlement = item.kind === 'settlement.created'
  const isShared = item.payload?.shared === true

  return (
    <div>
      {dateLabel && (
        <div className="px-4 py-2 text-[11px] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
          {dateLabel}
        </div>
      )}
      <div
        onClick={isSettlement ? () => navigate(`/activity/${item.id}`) : undefined}
        className={cn(
          'flex items-center gap-3 px-4 py-3.5',
          border && 'border-t border-[var(--color-border)]',
          isSettlement && 'cursor-pointer hover:bg-[var(--color-secondary)] transition-colors',
        )}
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: meta.color + '22' }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{getTitle(item, meId)}</div>
          <div className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
            {getSubtitle(item, meId)}
          </div>
          {isSettlement && isShared && (
            <span className="inline-flex items-center rounded-full bg-[#1DB954]/15 px-2 py-0.5 text-[10px] font-semibold text-[#1DB954] mt-1">
              Shared
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          {amount && (
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                amount.isCredit ? 'text-[#1DB954]' : 'text-[#E84040]',
              )}
            >
              {amount.isCredit ? '+' : '−'}{formatMoney(amount.amt, amount.currency)}
            </div>
          )}
          <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
            {format(ts, 'HH:mm')}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AddToGroupSheet({ open, onOpenChange, item, meId }) {
  const { data: groups = [] } = useGroups()
  const { data: allUsers = [] } = useUsers()
  const createGroup = useCreateGroup()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [mode, setMode] = useState('existing') // 'existing' | 'person'
  const [groupId, setGroupId] = useState('')
  const [search, setSearch] = useState('')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState('')
  const [creating, setCreating] = useState(false)

  const isSender = item.payload?.from_user === meId
  const otherName = isSender
    ? (item.payload?.to_name || 'contact')
    : (item.payload?.from_name || 'contact')
  const initialDescription = isSender
    ? `Payment to ${otherName}`
    : `Payment from ${otherName}`
  const initialAmount = item.payload?.amount_cents || 0

  const filteredUsers = allUsers.filter((u) => {
    if (u.id === meId) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.handle?.toLowerCase().includes(q)
    )
  })

  const openExpenseFor = (gid) => {
    setTargetGroupId(gid)
    setExpenseOpen(true)
  }

  const handleContinueExisting = () => {
    if (!groupId) return
    onOpenChange(false)
    openExpenseFor(groupId)
  }

  const handleSelectPerson = async (user) => {
    setCreating(true)
    try {
      const group = await createGroup.mutateAsync({
        name: `${user.display_name || user.handle}`,
        emoji: '👥',
        currency: item.payload?.currency || 'EUR',
        member_handles: [user.handle],
      })
      onOpenChange(false)
      openExpenseFor(group.id)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not create group', description: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleAfterSubmit = async () => {
    try {
      if (item.payload?.settlement_id) {
        await api.patch(`/settlements/${item.payload.settlement_id}/share`, { group_id: targetGroupId })
      }
      invalidateGlobal(qc)
    } catch {
      toast({ variant: 'error', title: 'Could not mark as shared' })
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
        <SheetContent className="rounded-t-2xl pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle>Add to group</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-2xl bg-[var(--color-secondary)] p-4 text-center">
              <div className="text-2xl font-bold tabular-nums">
                {formatMoney(item.payload?.amount_cents, item.payload?.currency || 'EUR')}
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                {isSender ? `Paid to ${otherName}` : `Received from ${otherName}`}
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl bg-[var(--color-secondary)] p-1 gap-1">
              {['existing', 'person'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
                    mode === m
                      ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
                      : 'text-[var(--color-muted-foreground)]',
                  )}
                >
                  {m === 'existing' ? 'Existing group' : 'New with person'}
                </button>
              ))}
            </div>

            {mode === 'existing' ? (
              <>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {groups.length === 0 && (
                    <div className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">No groups yet</div>
                  )}
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGroupId(g.id)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left',
                        groupId === g.id
                          ? 'bg-[var(--color-primary)]/15 ring-1 ring-[var(--color-primary)]'
                          : 'hover:bg-[var(--color-secondary)]',
                      )}
                    >
                      <span className="text-xl shrink-0">{g.emoji}</span>
                      <span className="text-sm font-medium truncate">{g.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button className="flex-1" disabled={!groupId} onClick={handleContinueExisting}>
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Input
                    placeholder="Search people…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 && (
                    <div className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">No people found</div>
                  )}
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={creating}
                      onClick={() => handleSelectPerson(u)}
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
                <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Cancel</Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddExpenseSheet
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        groupId={targetGroupId}
        initialDescription={initialDescription}
        initialAmount={initialAmount}
        onAfterSubmit={handleAfterSubmit}
      />
    </>
  )
}
