import { CategoryIcon } from './CategoryIcon'
import { formatMoney } from '@/lib/format'
import { computeShare } from '@/lib/split'
import { cn } from '@/lib/utils'

export function ExpenseRow({ expense, me, members = [], currency = 'EUR', onClick, className }) {
  const paidByMe = me && expense.paid_by === me.id
  const myShare = me ? computeShare(expense.split, expense.amount_cents, me.id) : 0
  const myImpactCents = paidByMe
    ? expense.amount_cents - myShare
    : me ? -myShare : 0

  const payer = members.find((m) => m.id === expense.paid_by)
  const payerName = payer?.display_name || 'someone'
  const isReceipt = !!expense.receipt_id

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-[var(--color-card-elevated)] transition-colors',
        className,
      )}
    >
      <CategoryIcon category={expense.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{expense.description}</span>
          {isReceipt && (
            <span className="shrink-0 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-[10px] font-semibold px-1.5 py-0.5">
              receipt
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
          {paidByMe ? 'You paid' : `${payerName} paid`}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums">
          {formatMoney(expense.amount_cents, currency)}
        </div>
        {myImpactCents !== 0 && me != null && (
          <div
            className="text-[10px] mt-0.5 tabular-nums"
            style={{ color: myImpactCents > 0 ? '#1DB954' : '#E84040' }}
          >
            {myImpactCents > 0
              ? `+${formatMoney(myImpactCents, currency)}`
              : `−${formatMoney(Math.abs(myImpactCents), currency)}`}
          </div>
        )}
      </div>
    </button>
  )
}
