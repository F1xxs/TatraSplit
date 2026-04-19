import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BalancePill } from './BalancePill'
import { cn } from '@/lib/utils'

export function GroupCard({ group, className }) {
  const net = group.net_cents ?? 0
  const memberCount = (group.members || []).length
  const isJar = !!group.jar_mode
  const status = isJar
    ? 'Moneybox '
    : Math.abs(net) < 1
      ? 'All settled'
      : net > 0
        ? 'You are owed'
        : 'You owe'

  return (
    <Link
      to={`/groups/${group.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-card-elevated)] transition-colors',
        className,
      )}
    >
      <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-lg">
        <span role="img" aria-hidden>{group.emoji || '👥'}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{group.name}</div>
        <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
          {memberCount} member{memberCount === 1 ? '' : 's'} · {status}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {!isJar && <BalancePill cents={net} currency={group.currency} />}
        <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
      </div>
    </Link>
  )
}
