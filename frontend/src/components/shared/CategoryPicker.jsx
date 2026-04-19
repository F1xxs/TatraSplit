import { CATEGORIES } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Pill-button grid for selecting an expense category.
 *
 * @param {string} value - active category id
 * @param {function} onChange - called with category id on selection
 */
export function CategoryPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const active = value === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-all',
              active
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-foreground)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
