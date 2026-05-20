import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberBalanceRow } from "@/components/group/MemberBalanceRow";
import {
  CategoryDonut,
  CategoryLegend,
} from "@/components/shared/CategoryDonut";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  category?: string;
  amount_cents?: number;
  [key: string]: any;
}

interface Member {
  id: string;
  user_id: string;
  display_name: string;
  color: string;
  net_cents?: number;
  [key: string]: any;
}

interface SimplifiedTransfer {
  from_user: string;
  to_user: string;
  from_name: string;
  to_name: string;
  amount_cents: number;
  [key: string]: any;
}

interface Balances {
  members?: Member[];
  simplified_transfers?: SimplifiedTransfer[];
  [key: string]: any;
}

interface User {
  id: string;
  [key: string]: any;
}

interface Settlement {
  from_user: string;
  to_user: string;
  amount_cents: number;
}

interface BalancesTabProps {
  balances?: Balances;
  expenses: Expense[];
  currency: string;
  me?: User;
  onSettle: (settlement: Settlement) => void;
}

function aggregateByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const c = e.category || "other";
    map.set(c, (map.get(c) || 0) + (e.amount_cents || 0));
  }
  return Array.from(map.entries()).map(([category, spent_cents]) => ({
    category,
    spent_cents,
  }));
}

export const BalancesTab: React.FC<BalancesTabProps> = ({
  balances,
  expenses,
  currency,
  me,
  onSettle,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold">
          Who owes what
        </div>
        {(balances?.members || []).length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No balances yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {balances?.members?.map((m) => (
              <MemberBalanceRow
                key={m.user_id}
                member={m}
                currency={currency}
                isMe={m.user_id === me?.id}
              />
            ))}
          </div>
        )}
      </div>

      {(balances?.simplified_transfers || []).length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold">
            Suggested settlements
          </div>
          {balances?.simplified_transfers?.map((t, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5",
                i > 0 && "border-t border-[var(--color-border)]",
              )}
            >
              <span className="text-sm font-medium">{t.from_name}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
              <span className="text-sm font-medium">{t.to_name}</span>
              <span className="ml-auto text-sm font-semibold tabular-nums">
                {formatMoney(t.amount_cents, currency)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() =>
                  onSettle({
                    from_user: t.from_user,
                    to_user: t.to_user,
                    amount_cents: t.amount_cents,
                  })
                }
              >
                Settle
              </Button>
            </div>
          ))}
        </div>
      )}

      {expenses.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="text-sm font-semibold mb-3">Spending by category</div>
          <CategoryDonut
            data={aggregateByCategory(expenses)}
            currency={currency}
          />
          <CategoryLegend
            data={aggregateByCategory(expenses)}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
};
