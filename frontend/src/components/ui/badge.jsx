import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
        secondary:
          'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        success:
          'border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)]',
        danger:
          'border-transparent bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
        info:
          'border-transparent bg-[var(--color-info)]/15 text-[var(--color-info)]',
        outline:
          'border-[var(--color-border)] text-[var(--color-muted-foreground)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
