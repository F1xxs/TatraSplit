import { Avatar } from "@/components/ui/avatar";
import { BalancePill } from "@/components/shared/BalancePill";
import { formatMoney } from "@/lib/format";

export function MemberBalanceRow({ member, currency, isMe }) {
  const net = member.net_cents ?? 0;
  const zero = Math.abs(net) < 1;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Avatar name={member.display_name} color={member.color} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">
          {member.display_name}
          {isMe && (
            <span className="text-[var(--color-muted-foreground)] text-xs font-normal">
              {" "}
              (you)
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-muted-foreground)]">
          {zero
            ? "All settled"
            : net > 0
              ? `Owed ${formatMoney(Math.abs(net), currency)}`
              : `Owes ${formatMoney(Math.abs(net), currency)}`}
        </div>
      </div>
      <BalancePill cents={net} currency={currency} />
    </div>
  );
}
