import { Skeleton } from "@/components/ui/skeleton";
import { AvatarStack } from "@/components/ui/avatar";
import { BalancePill } from "@/components/shared/BalancePill";

interface Member {
  id: string;
  display_name: string;
  color: string;
  [key: string]: any;
}

interface Group {
  id: string;
  name: string;
  emoji?: string;
  currency?: string;
  [key: string]: any;
}

interface GroupHeaderCardProps {
  group?: Group;
  members: Member[];
  currency: string;
  myNet: number;
  isLoading: boolean;
}

export const GroupHeaderCard: React.FC<GroupHeaderCardProps> = ({
  group,
  members,
  currency,
  myNet,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-5">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--color-secondary)] flex items-center justify-center text-2xl">
              <span role="img" aria-hidden>
                {group?.emoji || "👥"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {group?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <AvatarStack users={members} size="xs" max={5} />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
                  {currency}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wide">
              Your balance
            </div>
            <BalancePill cents={myNet} currency={currency} size="lg" />
          </div>
        </>
      )}
    </div>
  );
};
