import { Link } from 'react-router-dom'
import { CategoryIcon } from './CategoryIcon'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ExpenseRow({ expense, me, members = [], groupId, className }) {
  const paidByMe = me && (expense.paid_by === me.id || expense.paid_by === me._id)
  const myShare =
    me &&
    (expense.split || []).find(
      (s) => s.user_id === me.id || s.user_id === me._id,
    )?.share_cents

  const myImpactCents =
    myShare != null
      ? paidByMe
        ? expense.amount_cents - myShare
        : -myShare
      : 0

  const payer = members.find((m) => (m.id || m._id) === expense.paid_by)
  const payerName = payer?.display_name || 'someone'

  const isDebit = myImpactCents <= 0
  const amountColor = myImpactCents > 0 ? '#1DB954' : myImpactCents < 0 ? '#E84040' : undefined

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3.5',
        className,
      )}
    >
      <CategoryIcon category={expense.category} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{expense.description}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--color-muted-foreground)] truncate">
            {paidByMe ? 'You paid' : `${payerName} paid`}
          </span>
          {groupId && (
            <Link
              to={`/groups/${groupId}/settle`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center rounded-full bg-[#1DB954]/15 text-[#1DB954] text-[10px] font-semibold px-2 py-0.5 shrink-0 hover:bg-[#1DB954]/25 transition-colors"
            >
              Rozdeliť
            </Link>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className="text-sm font-semibold tabular-nums"
          style={amountColor ? { color: amountColor } : undefined}
        >
          {isDebit && myImpactCents !== 0 ? '−' : ''}{formatMoney(expense.amount_cents, expense.currency)}
        </div>
        {myShare != null && myImpactCents !== 0 && (
          <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
            {myImpactCents > 0
              ? `lent ${formatMoney(myImpactCents, expense.currency)}`
              : `owe ${formatMoney(Math.abs(myImpactCents), expense.currency)}`}
          </div>
        )}
      </div>
    </div>
  )
}
