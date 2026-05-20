import { AddBtn } from "@/components/group/AddBtn";
import { TransferRow } from "@/components/group/TransferRow";
import { DataState } from "@/components/shared/DataState";

interface User {
  id: string;
  display_name: string;
  [key: string]: any;
}

interface TransferItemData {
  id: string;
  from_user?: string;
  to_user?: string;
  amount_cents?: number;
  [key: string]: any;
}

interface TransfersTabProps {
  transfers: TransferItemData[];
  loading: boolean;
  error?: Error | null;
  refetch: () => void;
  members: User[];
  currency: string;
  onAdd: () => void;
  onEdit: (transfer: TransferItemData) => void;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({
  transfers,
  loading,
  error,
  refetch,
  members,
  currency,
  onAdd,
  onEdit,
}) => {
  return (
    <div className="space-y-3">
      <AddBtn onClick={onAdd}>Add transfer</AddBtn>

      <DataState
        loading={loading}
        error={error}
        empty={transfers.length === 0}
        emptyMessage="No transfers recorded yet."
        onRetry={refetch}
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden divide-y divide-[var(--color-border)]">
          {transfers.map((t) => (
            <TransferRow
              key={t.id}
              transfer={t as any}
              members={members}
              currency={currency}
              onEdit={() => onEdit(t)}
            />
          ))}
        </div>
      </DataState>
    </div>
  );
};
