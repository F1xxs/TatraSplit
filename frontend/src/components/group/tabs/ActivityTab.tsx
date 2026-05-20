import { ActivityItem } from "@/components/shared/ActivityItem";
import { DataState } from "@/components/shared/DataState";

interface Activity {
  id: string;
  [key: string]: any;
}

interface ActivityTabProps {
  activity: Activity[];
  loading: boolean;
  error?: Error | null;
  refetch: () => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
  activity,
  loading,
  error,
  refetch,
}) => {
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
            <ActivityItem key={a.id} item={a as any} />
          ))}
        </div>
      </DataState>
    </div>
  );
};
