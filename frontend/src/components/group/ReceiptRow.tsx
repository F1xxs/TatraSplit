import { Receipt } from "lucide-react";
import { RecordRow } from "./RecordRow";

interface Receipt {
  id: string;
  place?: string;
  metadata?: {
    total_cents?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ReceiptRowProps {
  receipt: Receipt;
  currency?: string;
  onEdit: () => void;
}

export const ReceiptRow: React.FC<ReceiptRowProps> = ({
  receipt,
  currency = "EUR",
  onEdit,
}) => {
  return (
    <RecordRow
      icon={
        <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center">
          <Receipt className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
      }
      name={receipt.place || "Receipt"}
      amount={receipt.metadata?.total_cents ?? 0}
      currency={currency}
      onEdit={onEdit}
    />
  );
};
