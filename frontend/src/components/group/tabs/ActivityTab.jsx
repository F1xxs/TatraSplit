import { ActivityItem } from "@/components/shared/ActivityItem";
import { DataState } from "@/components/shared/DataState";

export function ActivityTab({ activity, loading, error, refetch }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <DataState
        loading={loading}
        error={error}
        empty={activity.length === 0}
        emptyMessage="No activity yet."
        onRetry={refetch}
      >
        <div className="divide-y divide-[var(--color-border)]">
          {activity.map((a) => (
            <ActivityItem key={a.id} item={a} />
          ))}
        </div>
      </DataState>
    </div>
  );
}
