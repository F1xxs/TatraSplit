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
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

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
  default: 'border-[var(--color-border)] bg-[var(--color-card-elevated)]',
  success: 'border-[var(--color-success)]/40 bg-[var(--color-card-elevated)]',
  error: 'border-[var(--color-destructive)]/50 bg-[var(--color-card-elevated)]',
  info: 'border-[var(--color-info)]/40 bg-[var(--color-card-elevated)]',
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
        'pointer-events-auto rounded-xl border p-4 pr-8 shadow-xl backdrop-blur relative',
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
          {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
          {toast.description && (
            <div className="text-sm text-[var(--color-muted-foreground)]">
              {toast.description}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
