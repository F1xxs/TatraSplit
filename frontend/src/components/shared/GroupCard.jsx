import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AvatarStack } from '@/components/ui/avatar'
import { BalancePill } from './BalancePill'
import { cn } from '@/lib/utils'

export function GroupCard({ group, className }) {
  const net = group.net_cents ?? 0
  const status =
    Math.abs(net) < 1
      ? 'all settled'
      : net > 0
        ? 'you are owed'
        : 'you owe'
  return (
    <Link
      to={`/groups/${group.id || group._id}`}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-all hover:bg-[var(--color-card-elevated)] hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-2xl">
        <span role="img" aria-hidden>
          {group.emoji || '👥'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-[var(--color-foreground)] truncate">
            {group.name}
          </div>
          <BalancePill cents={net} currency={group.currency} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <AvatarStack users={group.members || []} max={4} size="xs" />
          <div className="text-xs text-[var(--color-muted-foreground)]">{status}</div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}
