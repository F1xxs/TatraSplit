import { AddBtn } from "@/components/group/AddBtn";
import { ReceiptRow } from "@/components/group/ReceiptRow";
import { DataState } from "@/components/shared/DataState";
import { useNavigate } from "react-router-dom";

interface Receipt {
  id: string;
  [key: string]: any;
}

interface ReceiptsTabProps {
  id: string;
  receipts: Receipt[];
  loading: boolean;
  error?: Error | null;
  refetch: () => void;
  currency: string;
}

export const ReceiptsTab: React.FC<ReceiptsTabProps> = ({
  id,
  receipts,
  loading,
  error,
  refetch,
  currency,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <AddBtn to={`/groups/${id}/receipts/new`}>Add receipt</AddBtn>

      <DataState
        loading={loading}
        error={error}
        empty={receipts.length === 0}
        emptyMessage="No receipts yet."
        onRetry={refetch}
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden divide-y divide-[var(--color-border)]">
          {receipts.map((r) => (
            <ReceiptRow
              key={r.id}
              receipt={r}
              currency={currency}
              onEdit={() => navigate(`/groups/${id}/receipts/${r.id}/edit`)}
            />
          ))}
        </div>
      </DataState>
    </div>
  );
};
