import { useEffect, useRef, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const operators = new Set(['+', '-', '*', '/'])

function evaluateExpression(raw) {
  const expr = raw.replace(/\s+/g, '')
  if (!expr || !/^[\d+\-*/.]+$/.test(expr)) return null

  const tokens = []
  let numberBuffer = ''
  for (const ch of expr) {
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      if (ch === '.' && numberBuffer.includes('.')) return null
      numberBuffer += ch
      continue
    }
    if (!operators.has(ch)) return null
    if (!numberBuffer || numberBuffer === '.') return null
    tokens.push(Number(numberBuffer))
    numberBuffer = ''
    tokens.push(ch)
  }
  if (!numberBuffer || numberBuffer === '.') return null
  tokens.push(Number(numberBuffer))

  if (typeof tokens[tokens.length - 1] !== 'number') return null

  const collapsed = [tokens[0]]
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const rhs = tokens[i + 1]
    if (op === '*' || op === '/') {
      const lhs = collapsed.pop()
      if (typeof lhs !== 'number' || typeof rhs !== 'number') return null
      if (op === '/' && rhs === 0) return null
      collapsed.push(op === '*' ? lhs * rhs : lhs / rhs)
      continue
    }
    collapsed.push(op, rhs)
  }

  let result = collapsed[0]
  for (let i = 1; i < collapsed.length; i += 2) {
    const op = collapsed[i]
    const rhs = collapsed[i + 1]
    if (typeof rhs !== 'number') return null
    result = op === '+' ? result + rhs : result - rhs
  }

  return Number.isFinite(result) ? result : null
}

function toCalculatorDisplay(expr) {
  return expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/\./g, ',')
}

function fromCalculatorDisplay(expr) {
  return expr.replace(/,/g, '.').replace(/[×x]/g, '*').replace(/÷/g, '/')
}

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
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [expression, setExpression] = useState('')
  const [calcError, setCalcError] = useState('')

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const display = ((value ?? 0) / 100).toFixed(2)

  const openCalculator = () => {
    setExpression(display)
    setCalcError('')
    setCalculatorOpen(true)
  }

  const handleChange = (e) => {
    // Keep only digits
    const digits = e.target.value.replace(/\D/g, '')
    const cents = digits === '' ? 0 : parseInt(digits, 10)
    onChange?.(cents)
  }

  const appendExpression = (token) => {
    setCalcError('')
    setExpression((prev) => {
      if (!prev) return token === '.' ? '0.' : token
      const last = prev[prev.length - 1]
      if (operators.has(token)) {
        if (operators.has(last)) return `${prev.slice(0, -1)}${token}`
        return `${prev}${token}`
      }
      if (token === '.') {
        let i = prev.length - 1
        while (i >= 0 && !operators.has(prev[i])) i -= 1
        const segment = prev.slice(i + 1)
        if (segment.includes('.')) return prev
      }
      return `${prev}${token}`
    })
  }

  const clearExpression = () => {
    setExpression('')
    setCalcError('')
  }

  const backspaceExpression = () => {
    setCalcError('')
    setExpression((prev) => prev.slice(0, -1))
  }

  const computeExpression = () => {
    const majorValue = evaluateExpression(expression)
    if (majorValue == null) {
      setCalcError('Enter a valid expression.')
      return null
    }
    if (majorValue < 0) {
      setCalcError('Amount cannot be negative.')
      return null
    }
    const cents = Math.round(majorValue * 100)
    setExpression((cents / 100).toFixed(2))
    setCalcError('')
    return cents
  }

  const handleEquals = () => {
    computeExpression()
  }

  const applyExpression = () => {
    const cents = computeExpression()
    if (cents == null) return
    onChange?.(cents)
    setCalculatorOpen(false)
  }

  const textSize = size === 'xl' ? 'text-5xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'

  return (
    <>
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
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={openCalculator}
          aria-label="Open calculator"
          className="h-9 w-9 shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <Calculator className="h-5 w-5" />
        </Button>
      </div>

      <Sheet
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        side="bottom"
        className="max-h-[70vh] w-full rounded-t-2xl sm:left-1/2 sm:right-auto sm:w-[24rem] sm:-translate-x-1/2"
      >
        <SheetContent className="space-y-0 overflow-hidden p-0">
          <div className="bg-black">
            <div className="px-3 pb-2 pt-3">
              <div className="text-xs text-[var(--color-muted-foreground)]">Suma*</div>
              <div className="mt-1 flex items-baseline justify-end gap-2">
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  value={toCalculatorDisplay(expression)}
                  onChange={(e) => {
                    const normalized = fromCalculatorDisplay(e.target.value)
                    if (/^[\d+\-*/.]*$/.test(normalized)) {
                      setExpression(normalized)
                      if (calcError) setCalcError('')
                    }
                  }}
                  className="w-full border-none bg-transparent text-right text-2xl font-semibold tabular-nums text-white outline-none focus:ring-0"
                  placeholder="0"
                />
                <span className="text-base font-semibold text-white">{currency === 'EUR' ? '€' : currency}</span>
              </div>
              <div className="mt-1.5 border-b border-white/35" />
              {calcError && <p className="mt-1 text-xs text-[var(--color-destructive)]">{calcError}</p>}
            </div>

            <div className="rounded-t-2xl bg-[#c4c9cf] p-1">
              <div className="grid grid-cols-[3fr_1fr] gap-1">
                <div className="grid grid-cols-3 gap-1">
                  <div className="col-span-3 flex h-8 items-center justify-end rounded-lg bg-[#e6e8eb] px-2 text-lg font-medium tabular-nums text-[#178edc]">
                    {toCalculatorDisplay(expression) || '0'}
                  </div>

                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        if (token === '⌫') {
                          backspaceExpression()
                          return
                        }
                        appendExpression(token === ',' ? '.' : token)
                      }}
                      className="h-8 rounded-lg bg-[#eceef0] text-xl font-medium text-black transition hover:brightness-95"
                    >
                      {token}
                    </button>
                  ))}
                </div>

                <div className="grid grid-rows-5 gap-1">
                  <button
                    type="button"
                    onClick={handleEquals}
                    className="h-8 rounded-lg bg-[#198fe0] text-xl font-semibold text-white transition hover:brightness-110"
                  >
                    =
                  </button>
                  {['+', '-', '×', '÷'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => appendExpression(token === '×' ? '*' : token === '÷' ? '/' : token)}
                      className="h-8 rounded-lg bg-[#1d2129] text-xl font-medium text-white transition hover:bg-[#252a34]"
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  onClick={clearExpression}
                  className="h-8 w-full rounded-lg bg-[#eceef0] text-xs font-semibold text-black transition hover:brightness-95"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={applyExpression}
                  className="h-8 w-full rounded-lg bg-[#198fe0] text-xs font-semibold text-white transition hover:brightness-110"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
