import { cn } from '@/lib/utils'
import { initials, colorForName } from '@/lib/format'

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

export function Avatar({ name, src, color, size = 'md', className, ring = false, ...props }) {
  const bg = color || colorForName(name || '')
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-white shrink-0',
        sizeMap[size] || sizeMap.md,
        ring && 'ring-2 ring-[var(--color-background)]',
        className,
      )}
      style={{ background: src ? undefined : bg }}
      {...props}
    >
      {src ? (
        <img src={src} alt={name || ''} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}

export function AvatarStack({ users = [], max = 4, size = 'sm', className }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        {shown.map((u) => (
          <Avatar key={u.id} name={u.display_name} color={u.color} size={size} ring />
        ))}
      </div>
      {extra > 0 && (
        <div
          className={cn(
            'ml-1 text-xs text-[var(--color-muted-foreground)]',
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
