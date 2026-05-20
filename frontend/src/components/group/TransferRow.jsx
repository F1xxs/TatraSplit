import { HandCoins } from "lucide-react";
import { RecordRow } from "./RecordRow";

export function TransferRow({
  transfer,
  members = [],
  currency = "EUR",
  onEdit,
}) {
  const from = members.find((m) => m.id === transfer.from_user) || {
    display_name: transfer.from_user,
  };
  const to = members.find((m) => m.id === transfer.to_user) || {
    display_name: transfer.to_user,
  };
  const sub = transfer.note || undefined;

  return (
    <RecordRow
      icon={
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "color-mix(in oklab, #1DB954 18%, transparent)",
          }}
        >
          <HandCoins className="h-5 w-5" style={{ color: "#1DB954" }} />
        </div>
      }
      name={`${from.display_name} → ${to.display_name}`}
      sub={sub || undefined}
      amount={transfer.amount_cents}
      currency={currency}
      onEdit={onEdit}
    />
  );
}
