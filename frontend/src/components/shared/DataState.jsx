import { RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Unified loading / error / empty state wrapper for list/detail pages.
 *
 * Props:
 *   loading      — show skeleton rows
 *   error        — show error + optional retry
 *   empty        — show emptyMessage (or emptyContent)
 *   emptyMessage — string fallback when empty (default: "Nothing here yet.")
 *   emptyContent — ReactNode override for custom empty state
 *   onRetry      — if provided, shows "Try again" button on error
 *   loadingRows  — number of skeleton rows (default: 3)
 *   children     — rendered when not loading/error/empty
 */
export function DataState({
  loading,
  error,
  empty,
  emptyMessage = 'Nothing here yet.',
  emptyContent,
  onRetry,
  loadingRows = 3,
  children,
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="text-sm text-[var(--color-muted-foreground)]">
          {error.message || 'Failed to load.'}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    if (emptyContent) return emptyContent
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
        {emptyMessage}
      </div>
    )
  }

  return children
}
