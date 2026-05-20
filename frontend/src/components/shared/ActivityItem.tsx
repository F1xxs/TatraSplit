import React from "react";
import { format } from "date-fns";
import {
  Receipt,
  HandCoins,
  UserPlus,
  Users,
  Bell,
  Trash2,
  LucideIcon,
} from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { RecordRow } from "@/components/group/RecordRow";

interface ActivityItemData {
  kind: string;
  created_at?: string;
  payload?: {
    description?: string;
    group_name?: string;
    amount_cents?: number;
    currency?: string;
    from_user?: string;
    to_user?: string;
    from_name?: string;
    to_name?: string;
    display_name?: string;
    handle?: string;
    name?: string;
  };
}

interface KindMeta {
  icon: LucideIcon;
  color: string;
}

interface AmountData {
  amt: number;
  currency: string;
  isCredit: boolean;
}

interface ActivityItemProps {
  item: ActivityItemData;
  className?: string;
}

const kindMeta: Record<string, KindMeta> = {
  "expense.created": { icon: Receipt, color: "#0070D2" },
  "expense.updated": { icon: Receipt, color: "#0070D2" },
  "expense.deleted": { icon: Trash2, color: "#E84040" },
  "transfer.created": { icon: HandCoins, color: "#1DB954" },
  "transfer.updated": { icon: HandCoins, color: "#1DB954" },
  "transfer.deleted": { icon: HandCoins, color: "#E84040" },
  "settlement.created": { icon: HandCoins, color: "#1DB954" },
  "settlement.updated": { icon: HandCoins, color: "#1DB954" },
  "settlement.deleted": { icon: HandCoins, color: "#E84040" },
  "group.created": { icon: Users, color: "#0070D2" },
  "member.joined": { icon: UserPlus, color: "#0070D2" },
  "group.member.joined": { icon: UserPlus, color: "#0070D2" },
  "reminder.sent": { icon: Bell, color: "#F59E0B" },
};

function getTitle(item: ActivityItemData, meId?: string): string {
  switch (item.kind) {
    case "expense.created":
    case "expense.updated":
      return item.payload?.description || "Expense";
    case "expense.deleted":
      return item.payload?.description || "Expense deleted";
    case "transfer.created":
    case "transfer.updated":
    case "settlement.created":
    case "settlement.updated": {
      const fromName = item.payload?.from_name || "someone";
      const toName = item.payload?.to_name || "someone";
      if (item.payload?.to_user && meId && item.payload.to_user === meId)
        return `Received from ${fromName}`;
      if (item.payload?.from_user && meId && item.payload.from_user === meId)
        return `Payment to ${toName}`;
      return `${fromName} paid ${toName}`;
    }
    case "transfer.deleted":
    case "settlement.deleted":
      return "Transfer removed";
    case "group.created":
      return item.payload?.name || "New group";
    case "member.joined":
    case "group.member.joined":
      return `${item.payload?.display_name || item.payload?.handle || "Someone"} joined`;
    default:
      return item.kind;
  }
}

function getSubtitle(item: ActivityItemData): string {
  const group = item.payload?.group_name;
  switch (item.kind) {
    case "expense.created":
    case "expense.updated":
    case "expense.deleted":
      return group || "";
    case "transfer.created":
    case "transfer.updated":
    case "settlement.created":
    case "settlement.updated":
      return `Payment${group ? ` · ${group}` : ""}`;
    case "transfer.deleted":
    case "settlement.deleted":
      return group || "";
    case "group.created":
      return "Group created";
    case "member.joined":
    case "group.member.joined":
      return group || "Joined group";
    default:
      return group || "";
  }
}

function getAmount(item: ActivityItemData, meId?: string): AmountData | null {
  if (item.payload?.amount_cents == null) return null;
  const amt = item.payload.amount_cents;
  const currency = item.payload?.currency || "EUR";
  let isCredit = true;
  if (
    [
      "transfer.created",
      "transfer.updated",
      "settlement.created",
      "settlement.updated",
    ].includes(item.kind)
  ) {
    isCredit = !(
      item.payload?.from_user &&
      meId &&
      item.payload.from_user === meId
    );
  } else if (
    item.kind === "expense.created" ||
    item.kind === "expense.updated"
  ) {
    isCredit = false;
  }
  return { amt, currency, isCredit };
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  item,
  className,
}) => {
  const { data: me } = useMe();
  const meId = (me as any)?.id;
  const meta = kindMeta[item.kind] || kindMeta["expense.created"];
  const Icon = meta.icon;
  const ts = item.created_at ? new Date(item.created_at) : null;
  const amount = getAmount(item, meId);

  const icon = (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
      style={{ background: meta.color + "22" }}
    >
      <Icon className="h-5 w-5" style={{ color: meta.color }} />
    </div>
  );

  const sub = [getSubtitle(item), ts ? format(ts, "HH:mm") : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <RecordRow
      className={className}
      icon={icon}
      name={getTitle(item, meId)}
      sub={sub || undefined}
      amount={amount?.amt}
      amountColor={
        amount ? (amount.isCredit ? "#1DB954" : "#E84040") : undefined
      }
      amountPrefix={amount ? (amount.isCredit ? "+" : "−") : ""}
      currency={amount?.currency}
    />
  );
};
