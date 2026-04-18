import { cn } from '@/lib/utils'

export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider',
        className,
      )}
      {...props}
    />
  )
}
