import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastCtx = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((opts) => {
    const id = ++toastId
    const t = { id, variant: 'default', duration: 3200, ...opts }
    setToasts((xs) => [...xs, t])
    if (t.duration > 0) {
      setTimeout(() => {
        setToasts((xs) => xs.filter((x) => x.id !== id))
      }, t.duration)
    }
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((xs) => xs.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-24 z-[1000] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-6 sm:w-full sm:max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const iconMap = {
  default: Info,
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const styleMap = {
  default: 'border-[var(--color-primary)]/30 bg-[var(--color-card-elevated)]',
  success: 'border-[var(--color-success)]/35 bg-[var(--color-card-elevated)]',
  error: 'border-[var(--color-destructive)]/45 bg-[var(--color-card-elevated)]',
  info: 'border-[var(--color-info)]/35 bg-[var(--color-card-elevated)]',
}

const iconColorMap = {
  default: 'text-[var(--color-muted-foreground)]',
  success: 'text-[var(--color-success)]',
  error: 'text-[var(--color-destructive)]',
  info: 'text-[var(--color-info)]',
}

function ToastItem({ toast, onDismiss }) {
  const Icon = iconMap[toast.variant] || Info
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (toast.duration > 0) {
      const t = setTimeout(() => setLeaving(true), toast.duration - 180)
      return () => clearTimeout(t)
    }
  }, [toast.duration])

  return (
    <div
      className={cn(
        'pointer-events-auto relative max-w-full overflow-hidden rounded-xl border p-3 pr-9 shadow-xl ring-1 ring-white/5 sm:p-4 sm:pr-10',
        styleMap[toast.variant] || styleMap.default,
      )}
      style={{
        animation: leaving
          ? 'fade-out 180ms ease-in forwards, slide-out-to-right 180ms ease-in forwards'
          : 'fade-in 180ms ease-out, slide-in-from-right 220ms cubic-bezier(0.22,0.61,0.36,1)',
      }}
    >
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconColorMap[toast.variant])} />
        <div className="flex-1 min-w-0">
          {toast.title && <div className="text-sm font-semibold break-words">{toast.title}</div>}
          {toast.description && (
            <div className="text-xs break-words text-[var(--color-muted-foreground)] sm:text-sm">
              {toast.description}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded leading-none text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] sm:right-3 sm:top-3"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
