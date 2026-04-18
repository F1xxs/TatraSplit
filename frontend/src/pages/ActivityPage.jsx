import { BankTransactionRow } from '@/components/shared/ActivityItem'
import { DataState } from '@/components/shared/DataState'
import { useActivity } from '@/hooks/useGroups'
import { format } from 'date-fns'

function groupByDate(items) {
  const groups = []
  let lastDate = null
  for (const item of items) {
    const d = item.created_at ? new Date(item.created_at) : new Date()
    const label = format(d, 'd MMMM yyyy')
    if (label !== lastDate) {
      groups.push({ dateLabel: label, item })
      lastDate = label
    } else {
      groups.push({ dateLabel: null, item })
    }
  }
  return groups
}

export function ActivityPage() {
  const { data: items = [], isLoading, error, refetch } = useActivity()
  const rows = groupByDate(items)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Account transactions</h1>
      </div>

      {/* Search stub */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5">
        <svg className="h-4 w-4 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <span className="text-sm text-[var(--color-muted-foreground)]">Search</span>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <DataState
          loading={isLoading}
          error={error}
          empty={items.length === 0}
          emptyMessage="Nothing yet. Add an expense to get started."
          onRetry={refetch}
          loadingRows={5}
        >
          <div>
            {rows.map(({ dateLabel, item }, i) => (
              <BankTransactionRow
                key={item.id}
                item={item}
                border={i > 0 && !dateLabel}
                dateLabel={dateLabel}
              />
            ))}
          </div>
        </DataState>
      </div>
    </div>
  )
}
