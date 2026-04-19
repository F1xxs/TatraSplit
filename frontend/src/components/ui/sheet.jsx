import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  className,
  zIndex = 90,
  showCloseButton = true,
  children,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onOpenChange])
  if (!open) return null

  const posClass =
    side === 'right'
      ? 'top-0 right-0 h-full w-full sm:max-w-md border-l'
      : side === 'left'
        ? 'top-0 left-0 h-full w-full sm:max-w-md border-r'
        : side === 'bottom'
          ? 'bottom-0 left-0 right-0 max-h-[92vh] rounded-t-3xl border-t'
          : 'top-0 left-0 right-0 max-h-[92vh] rounded-b-3xl border-b'

  const anim =
    side === 'right'
      ? 'slide-in-from-right 260ms cubic-bezier(0.22, 0.61, 0.36, 1)'
      : side === 'left'
        ? 'slide-in-from-right 260ms cubic-bezier(0.22, 0.61, 0.36, 1) reverse'
        : 'slide-in-from-bottom 260ms cubic-bezier(0.22, 0.61, 0.36, 1)'

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ animation: 'fade-in 200ms ease-out', touchAction: 'none' }}
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={cn(
          'absolute z-10 flex flex-col border-[var(--color-border)] bg-[var(--color-card-elevated)] shadow-2xl',
          posClass,
          className,
        )}
        style={{ animation: anim }}
      >
        {showCloseButton && (
          <button
            onClick={() => onOpenChange?.(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 rounded-md p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        'border-b border-[var(--color-border)] p-6 pr-12',
        className,
      )}
      {...props}
    />
  )
}

export function SheetTitle({ className, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

export function SheetDescription({ className, ...props }) {
  return (
    <p
      className={cn('mt-1 text-sm text-[var(--color-muted-foreground)]', className)}
      {...props}
    />
  )
}

export function SheetContent({ className, ...props }) {
  return (
    <div
      className={cn('flex-1 min-h-0 overflow-y-scroll overscroll-contain p-6', className)}
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      {...props}
    />
  )
}

export function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'border-t border-[var(--color-border)] p-4 flex gap-2 justify-end',
        className,
      )}
      {...props}
    />
  )
}
