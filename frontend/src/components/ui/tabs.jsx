import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

const TabsCtx = createContext(null)

export function Tabs({ value, defaultValue, onValueChange, className, children }) {
  const [internal, setInternal] = useState(defaultValue)
  const v = value !== undefined ? value : internal
  const setV = (nv) => {
    if (value === undefined) setInternal(nv)
    onValueChange?.(nv)
  }
  return (
    <TabsCtx.Provider value={{ value: v, setValue: setV }}>
      <div className={cn('flex flex-col gap-4', className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ className, children }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-secondary)] p-1 text-[var(--color-muted-foreground)] self-start',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsCtx)
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm'
          : 'hover:text-[var(--color-foreground)]',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsCtx)
  if (ctx.value !== value) return null
  return <div className={cn('focus-visible:outline-none', className)}>{children}</div>
}
