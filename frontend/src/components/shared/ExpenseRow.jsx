import { CategoryIcon } from './CategoryIcon'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ExpenseRow({ expense, me, members = [], className }) {
  const paidByMe = me && (expense.paid_by === me.id || expense.paid_by === me._id)
  const myShare =
    me &&
    (expense.split || []).find(
      (s) => s.user_id === me.id || s.user_id === me._id,
    )?.share_cents

  const myImpactCents =
    myShare != null
      ? paidByMe
        ? expense.amount_cents - myShare // lent out
        : -myShare // owed
      : 0

  const payer = members.find((m) => (m.id || m._id) === expense.paid_by)
  const payerName = payer?.display_name || 'someone'

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-[var(--color-secondary)]/60 transition-colors',
        className,
      )}
    >
      <CategoryIcon category={expense.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium truncate">{expense.description}</div>
          <div className="font-semibold tabular-nums">
            {formatMoney(expense.amount_cents, expense.currency)}
          </div>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
          <div className="truncate">
            {paidByMe ? 'You paid' : `${payerName} paid`}
          </div>
          {myShare != null ? (
            <div
              className={cn(
                'tabular-nums',
                myImpactCents > 0
                  ? 'text-[var(--color-success)]'
                  : myImpactCents < 0
                    ? 'text-[var(--color-destructive)]'
                    : '',
              )}
            >
              {myImpactCents > 0
                ? `you lent ${formatMoney(myImpactCents, expense.currency)}`
                : myImpactCents < 0
                  ? `you owe ${formatMoney(Math.abs(myImpactCents), expense.currency)}`
                  : 'not involved'}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
