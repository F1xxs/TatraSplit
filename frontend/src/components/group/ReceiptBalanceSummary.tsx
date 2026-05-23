import { Avatar } from "@/components/ui/avatar";
import { BalancePill } from "@/components/shared/BalancePill";
import { computeShare } from "@/lib/split";

interface Member {
  id: string;
  display_name: string;
  color: string;
}

interface SplitMember {
  user_id: string;
  value: number;
}

interface Expense {
  amount_cents: number;
  paid_by: string;
  split?: { type: string; members: SplitMember[] };
}

interface ReceiptBalanceSummaryProps {
  items: Expense[];
  members: Member[];
  me?: { id: string };
  currency: string;
}

export const ReceiptBalanceSummary: React.FC<ReceiptBalanceSummaryProps> = ({
  items,
  members,
  me,
  currency,
}) => {
  const nets: Record<string, number> = {};
  for (const m of members) nets[m.id] = 0;

  for (const item of items) {
    if (item.paid_by && item.paid_by in nets) {
      nets[item.paid_by] += item.amount_cents;
    }
    for (const m of members) {
      nets[m.id] -= computeShare(item.split, item.amount_cents, m.id);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-medium">Receipt balances</h2>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {members.map((m) => {
          const net = nets[m.id] ?? 0;
          const isMe = m.id === me?.id;
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.display_name} color={m.color} size="sm" />
              <span className="flex-1 text-sm font-medium truncate">
                {isMe ? "You" : m.display_name}
              </span>
              <BalancePill cents={net} currency={currency} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
