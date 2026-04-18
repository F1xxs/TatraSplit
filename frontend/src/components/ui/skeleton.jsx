import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md bg-[var(--color-secondary)] relative overflow-hidden',
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, hsl(240 5% 13%) 0%, hsl(240 5% 18%) 50%, hsl(240 5% 13%) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s ease-in-out infinite',
      }}
      {...props}
    />
  )
}
