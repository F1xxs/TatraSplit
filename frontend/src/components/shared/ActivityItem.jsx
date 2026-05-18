import { format } from 'date-fns'
import { Receipt, HandCoins, UserPlus, Users, Bell, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMe } from '@/hooks/useMe'

const kindMeta = {
  'expense.created':      { icon: Receipt,   color: '#0070D2' },
  'expense.updated':      { icon: Receipt,   color: '#0070D2' },
  'expense.deleted':      { icon: Trash2,    color: '#E84040' },
  'settlement.created':   { icon: HandCoins, color: '#1DB954' },
  'settlement.updated':   { icon: HandCoins, color: '#1DB954' },
  'settlement.deleted':   { icon: HandCoins, color: '#E84040' },
  'group.created':        { icon: Users,     color: '#0070D2' },
  'member.joined':        { icon: UserPlus,  color: '#0070D2' },
  'group.member.joined':  { icon: UserPlus,  color: '#0070D2' },
  'reminder.sent':        { icon: Bell,      color: '#F59E0B' },
}

function getTitle(item, meId) {
  switch (item.kind) {
    case 'expense.created':
    case 'expense.updated':
      return item.payload?.description || 'Expense'
    case 'expense.deleted':
      return item.payload?.description || 'Expense deleted'
    case 'settlement.created':
    case 'settlement.updated': {
      const fromName = item.payload?.from_name || 'someone'
      const toName = item.payload?.to_name || 'someone'
      if (item.payload?.to_user && meId && item.payload.to_user === meId)
        return `Received from ${fromName}`
      if (item.payload?.from_user && meId && item.payload.from_user === meId)
        return `Payment to ${toName}`
      return `${fromName} paid ${toName}`
    }
    case 'settlement.deleted':
      return 'Settlement removed'
    case 'group.created':
      return item.payload?.name || 'New group'
    case 'member.joined':
    case 'group.member.joined':
      return `${item.payload?.display_name || item.payload?.handle || 'Someone'} joined`
    default:
      return item.kind
  }
}

function getSubtitle(item) {
  const group = item.payload?.group_name
  switch (item.kind) {
    case 'expense.created':
    case 'expense.updated':
    case 'expense.deleted':
      return group || ''
    case 'settlement.created':
    case 'settlement.updated':
      return `Payment${group ? ` · ${group}` : ''}`
    case 'settlement.deleted':
      return group || ''
    case 'group.created':
      return 'Group created'
    case 'member.joined':
    case 'group.member.joined':
      return group || 'Joined group'
    default:
      return group || ''
  }
}

function getAmount(item, meId) {
  if (item.payload?.amount_cents == null) return null
  const amt = item.payload.amount_cents
  const currency = item.payload?.currency || 'EUR'
  let isCredit = true
  if (item.kind === 'settlement.created' || item.kind === 'settlement.updated') {
    isCredit = !(item.payload?.from_user && meId && item.payload.from_user === meId)
  } else if (item.kind === 'expense.created' || item.kind === 'expense.updated') {
    isCredit = false
  }
  return { amt, currency, isCredit }
}

export function ActivityItem({ item, className }) {
  const { data: me } = useMe()
  const meId = me?.id
  const meta = kindMeta[item.kind] || kindMeta['expense.created']
  const Icon = meta.icon
  const ts = item.created_at ? new Date(item.created_at) : null
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
          {getSubtitle(item)}
          {ts && <span className="ml-1">· {format(ts, 'HH:mm')}</span>}
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
