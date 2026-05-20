import { Receipt } from "lucide-react";
import { RecordRow } from "./RecordRow";

export function ReceiptRow({ receipt, currency = "EUR", onEdit }) {
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
}
