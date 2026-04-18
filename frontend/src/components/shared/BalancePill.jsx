import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'

export function BalancePill({ cents, currency = 'EUR', size = 'md', className }) {
  const zero = Math.abs(cents || 0) < 1
  const positive = (cents || 0) > 0
  const palette = zero
    ? 'bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]'
    : positive
      ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
      : 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]'
  const sz =
    size === 'lg' ? 'text-base px-3 py-1.5' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  const prefix = zero ? '' : positive ? '+' : '-'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold tabular-nums',
        palette,
        sz,
        className,
      )}
    >
      {prefix}
      {formatMoney(Math.abs(cents || 0), currency)}
    </span>
  )
}
