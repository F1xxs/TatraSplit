import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Controlled input. Value is amount_cents (integer).
export function MoneyInput({
  value,
  onChange,
  currency = 'EUR',
  autoFocus = false,
  size = 'xl',
  className,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const display = ((value ?? 0) / 100).toFixed(2)

  const handleChange = (e) => {
    // Keep only digits
    const digits = e.target.value.replace(/\D/g, '')
    const cents = digits === '' ? 0 : parseInt(digits, 10)
    onChange?.(cents)
  }

  const textSize = size === 'xl' ? 'text-5xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'

  return (
    <div className={cn('flex items-baseline justify-center gap-2 font-semibold tabular-nums', className)}>
      <span className={cn('text-[var(--color-muted-foreground)]', size === 'xl' ? 'text-3xl' : 'text-xl')}>
        {currency === 'EUR' ? '€' : currency}
      </span>
      <input
        ref={inputRef}
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        className={cn(
          'bg-transparent border-none outline-none text-center w-auto min-w-[4ch] focus:ring-0',
          textSize,
        )}
        style={{ width: `${Math.max(display.length, 4) + 0.5}ch` }}
      />
    </div>
  )
}
