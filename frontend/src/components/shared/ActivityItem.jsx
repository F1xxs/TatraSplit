import { format } from 'date-fns'
import { Receipt, HandCoins, UserPlus, Users, Bell, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const kindMeta = {
  'expense.created':    { icon: Receipt,   color: '#0070D2' },
  'expense.deleted':    { icon: Trash2,    color: '#E84040' },
  'settlement.created': { icon: HandCoins, color: '#1DB954' },
  'group.created':      { icon: Users,     color: '#0070D2' },
  'member.joined':      { icon: UserPlus,  color: '#0070D2' },
  'reminder.sent':      { icon: Bell,      color: '#F59E0B' },
}

function getTitle(item) {
  const actor = item.payload?.actor_name || 'Someone'
  switch (item.kind) {
    case 'expense.created':   return item.payload?.description || 'Expense'
    case 'expense.deleted':   return item.payload?.description || 'Expense deleted'
    case 'settlement.created': return `Payment to ${item.payload?.to_name || 'someone'}`
    case 'group.created':     return item.payload?.group_name || 'New group'
    case 'member.joined':     return `${actor} joined`
    default: return item.kind
  }
}

function getSubtitle(item) {
  const group = item.payload?.group_name
  switch (item.kind) {
    case 'expense.created':
      return `${item.payload?.actor_name || 'Someone'} paid${group ? ` · ${group}` : ''}`
    case 'settlement.created':
      return `Payment sent${group ? ` · ${group}` : ''}`
    case 'group.created':
      return 'Group created'
    case 'member.joined':
      return group || 'Joined group'
    default: return group || ''
  }
}

function getAmount(item) {
  if (item.payload?.amount_cents == null) return null
  const amt = item.payload.amount_cents
  const currency = item.payload?.currency || 'EUR'
  const isCredit = item.kind === 'settlement.created'
  return { amt, currency, isCredit }
}

export function ActivityItem({ item, className }) {
  const meta = kindMeta[item.kind] || kindMeta['expense.created']
  const Icon = meta.icon
  const amount = getAmount(item)

  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: meta.color + '22' }}
      >
        <Icon className="h-5 w-5" style={{ color: meta.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{getTitle(item)}</div>
        <div className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
          {getSubtitle(item)}
        </div>
      </div>
      {amount && (
        <div
          className={cn(
            'text-sm font-semibold tabular-nums shrink-0',
            amount.isCredit ? 'text-[#1DB954]' : 'text-[#E84040]',
          )}
        >
          {amount.isCredit ? '' : '−'}{formatMoney(amount.amt, amount.currency)}
        </div>
      )}
    </div>
  )
}

/* Bank-style transaction row used in Dashboard and ActivityPage */
export function BankTransactionRow({ item, border, dateLabel }) {
  const meta = kindMeta[item.kind] || kindMeta['expense.created']
  const Icon = meta.icon
  const ts = item.created_at ? new Date(item.created_at) : new Date()
  const amount = getAmount(item)

  return (
    <div>
      {dateLabel && (
        <div className="px-4 py-2 text-[11px] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
          {dateLabel}
        </div>
      )}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3.5',
          border && 'border-t border-[var(--color-border)]',
        )}
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: meta.color + '22' }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{getTitle(item)}</div>
          <div className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
            {getSubtitle(item)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {amount && (
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                amount.isCredit ? 'text-[#1DB954]' : 'text-[#E84040]',
              )}
            >
              {amount.isCredit ? '' : '−'}{formatMoney(amount.amt, amount.currency)}
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
