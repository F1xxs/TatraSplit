import { AddBtn } from "@/components/group/AddBtn";
import { ExpenseRow } from "@/components/group/ExpenseRow";
import { DataState } from "@/components/shared/DataState";
import { useNavigate } from "react-router-dom";

function groupByDate(items) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const byDate = new Map();
  for (const e of items) {
    const key = fmt.format(e.created_at ? new Date(e.created_at) : new Date());
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(e);
  }
  return Array.from(byDate.entries()).map(([date, items]) => ({ date, items }));
}

export function ExpensesTab({
  id,
  expenses,
  loading,
  error,
  refetch,
  me,
  members,
  currency,
}) {
  const navigate = useNavigate();
  const standalone = expenses.filter((e) => !e.receipt_id);

  return (
    <div className="space-y-3">
      <AddBtn to={`/groups/${id}/expenses/new`}>Add expense</AddBtn>

      <DataState
        loading={loading}
        error={error}
        empty={standalone.length === 0}
        emptyMessage="No expenses yet."
        onRetry={refetch}
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          {groupByDate(standalone).map(({ date, items }) => (
            <div key={date}>
              <div className="px-4 py-2 text-[11px] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)] bg-[var(--color-card-elevated)]">
                {date}
              </div>
              {items.map((e, i) => (
                <div
                  key={e.id}
                  className={
                    i > 0 ? "border-t border-[var(--color-border)]" : ""
                  }
                >
                  <ExpenseRow
                    expense={e}
                    me={me}
                    members={members}
                    currency={currency}
                    onEdit={() =>
                      navigate(`/groups/${id}/expenses/${e.id}/edit`)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </DataState>
    </div>
  );
}
