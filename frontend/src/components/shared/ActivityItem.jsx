import { formatDistanceToNowStrict } from 'date-fns'
import { Receipt, HandCoins, UserPlus, Users, Bell, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const kindMeta = {
  'expense.created':    { icon: Receipt,  color: 'var(--color-chart-1)' },
  'expense.deleted':    { icon: Trash2,   color: 'var(--color-destructive)' },
  'settlement.created': { icon: HandCoins, color: 'var(--color-success)' },
  'group.created':      { icon: Users,    color: 'var(--color-info)' },
  'member.joined':      { icon: UserPlus, color: 'var(--color-chart-2)' },
  'reminder.sent':      { icon: Bell,     color: 'var(--color-warning)' },
}

function describe(item) {
  const actor = item.payload?.actor_name || 'Someone'
  const group = item.payload?.group_name ? ` in ${item.payload.group_name}` : ''
  const amt =
    item.payload?.amount_cents != null
      ? ` ${formatMoney(item.payload.amount_cents, item.payload.currency || 'EUR')}`
      : ''

  switch (item.kind) {
    case 'expense.created':
      return (
        <>
          <b>{actor}</b> added <b>{item.payload?.description || 'an expense'}</b>
          {amt}
          {group}
        </>
      )
    case 'expense.deleted':
      return (
        <>
          <b>{actor}</b> deleted <b>{item.payload?.description || 'an expense'}</b>
          {group}
        </>
      )
    case 'settlement.created':
      return (
        <>
          <b>{actor}</b> paid <b>{item.payload?.to_name || 'someone'}</b>
          {amt}
          {group}
        </>
      )
    case 'group.created':
      return (
        <>
          <b>{actor}</b> created group <b>{item.payload?.group_name}</b>
        </>
      )
    case 'member.joined':
      return (
        <>
          <b>{actor}</b> joined <b>{item.payload?.group_name}</b>
        </>
      )
    default:
      return <span className="text-[var(--color-muted-foreground)]">{item.kind}</span>
  }
}

export function ActivityItem({ item, className }) {
  const meta = kindMeta[item.kind] || kindMeta['expense.created']
  const Icon = meta.icon
  const ts = item.created_at ? new Date(item.created_at) : new Date()
  return (
    <div className={cn('flex items-start gap-3 p-3', className)}>
      <div className="relative shrink-0">
        <Avatar name={item.payload?.actor_name} size="sm" />
        <div
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full ring-2 ring-[var(--color-background)] flex items-center justify-center"
          style={{ background: meta.color }}
        >
          <Icon className="h-3 w-3 text-[var(--color-background)]" strokeWidth={2.5} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">{describe(item)}</div>
        <div className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {formatDistanceToNowStrict(ts, { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}
