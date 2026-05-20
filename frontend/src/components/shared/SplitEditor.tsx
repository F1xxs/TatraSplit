import React, { useMemo, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { distributeEqualSplit, defaultSplitData } from "@/lib/split";

interface Member {
  id: string;
  display_name: string;
  color?: string;
}

interface SplitData {
  user_id: string;
  value: number;
}

interface SplitEditorProps {
  members: Member[];
  amountCents: number;
  currency?: string;
  splitType: string;
  onSplitTypeChange: (type: string) => void;
  splitData: SplitData[];
  onSplitDataChange: (data: SplitData[] | string[]) => void;
  payerId?: string;
}

interface StatusBarProps {
  ok: boolean;
  over: boolean;
  label: string;
  actions?: ReactNode;
}

const Checkbox: React.FC<{ checked: boolean }> = ({ checked }) => {
  return (
    <div
      className={cn(
        "h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition",
        checked
          ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
          : "border-[var(--color-border)]",
      )}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-3 w-3 text-[var(--color-primary-foreground)]"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

const StatusBar: React.FC<StatusBarProps> = ({ ok, over, label, actions }) => {
  return (
    <div className="mt-3 space-y-1">
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm",
          ok
            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
            : over
              ? "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]"
              : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
        )}
      >
        {label}
      </div>
      {actions && <div className="px-1">{actions}</div>}
    </div>
  );
};

export const SplitEditor: React.FC<SplitEditorProps> = ({
  members,
  amountCents,
  currency = "EUR",
  splitType,
  onSplitTypeChange,
  splitData,
  onSplitDataChange,
  payerId,
}) => {
  const memberIds = members.map((m) => m.id);

  const handleTabChange = (type: string): void => {
    onSplitTypeChange(type);
    onSplitDataChange((defaultSplitData(type, members, amountCents) as any) as SplitData[]);
  };

  const getData = (id: string): SplitData | undefined =>
    (splitData as SplitData[]).find((s) => s.user_id === id);

  const setData = (id: string, value: number): void => {
    const next = (splitData as SplitData[]).some((s) => s.user_id === id)
      ? (splitData as SplitData[]).map((s) =>
          s.user_id === id ? { ...s, value } : s,
        )
      : [...(splitData as SplitData[]), { user_id: id, value }];
    onSplitDataChange(next);
  };

  const includedIds = useMemo(
    () => (splitData as SplitData[]).map((s) => s.user_id),
    [splitData],
  );

  const toggleIncluded = (id: string, included: boolean): void => {
    const next = included
      ? [...includedIds, id].filter((x) => memberIds.includes(x))
      : includedIds.filter((x) => x !== id);
    onSplitDataChange(next.map((uid) => ({ user_id: uid, value: 1 })));
  };

  const equalShares = useMemo(
    () => distributeEqualSplit(amountCents, includedIds),
    [amountCents, includedIds],
  );

  const customSum = useMemo(
    () =>
      (splitData as SplitData[]).reduce(
        (a, s) => a + (splitType === "custom" ? s.value || 0 : 0),
        0,
      ),
    [splitData, splitType],
  );
  const customRemainder = amountCents - customSum;

  const pctSum = useMemo(
    () =>
      (splitData as SplitData[]).reduce(
        (a, s) => a + (splitType === "percentage" ? s.value || 0 : 0),
        0,
      ),
    [splitData, splitType],
  );

  const totalShares = useMemo(
    () =>
      (splitData as SplitData[]).reduce(
        (a, s) => a + (splitType === "shares" ? s.value || 0 : 0),
        0,
      ),
    [splitData, splitType],
  );

  return (
    <div className="space-y-3">
      <Tabs value={splitType} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="equal">Equal</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="percentage">Percent</TabsTrigger>
          <TabsTrigger value="shares">Shares</TabsTrigger>
        </TabsList>

        <TabsContent value="equal">
          <div className="space-y-1.5">
            {members.map((m) => {
              const included = includedIds.includes(m.id);
              const share =
                equalShares.find((s) => s.user_id === m.id)?.share_cents || 0;
              return (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors",
                    included
                      ? "bg-[var(--color-secondary)]"
                      : "opacity-60 hover:opacity-100 hover:bg-[var(--color-secondary)]/50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={included}
                    onChange={(e) => toggleIncluded(m.id, e.target.checked)}
                  />
                  <Checkbox checked={included} />
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="flex-1 min-w-0 truncate text-sm">
                    {m.display_name}
                  </div>
                  <div className="tabular-nums text-sm text-[var(--color-muted-foreground)]">
                    {included ? formatMoney(share, currency) : "—"}
                  </div>
                </label>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <div className="space-y-1.5">
            {members.map((m) => {
              const entry = getData(m.id);
              const cents = entry?.value ?? 0;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 bg-[var(--color-secondary)]"
                >
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="flex-1 min-w-0 truncate text-sm">
                    {m.display_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      €
                    </span>
                    <input
                      inputMode="decimal"
                      className="h-8 w-24 bg-[var(--color-background)] rounded-md border border-[var(--color-border)] px-2 text-right tabular-nums text-sm outline-none focus:border-[var(--color-primary)]"
                      value={(cents / 100).toFixed(2)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setData(m.id, raw === "" ? 0 : parseInt(raw, 10));
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <StatusBar
            ok={customRemainder === 0}
            over={customRemainder < 0}
            label={
              customRemainder === 0
                ? "Split is balanced"
                : customRemainder > 0
                  ? `${formatMoney(customRemainder, currency)} left to assign`
                  : `${formatMoney(Math.abs(customRemainder), currency)} over budget`
            }
            actions={
              customRemainder !== 0 &&
              payerId &&
              (splitData as SplitData[]).some((s) => s.user_id === payerId) ? (
                <button
                  type="button"
                  onClick={() => {
                    const entry = getData(payerId);
                    const cur = entry?.value ?? 0;
                    setData(payerId, Math.max(0, cur + customRemainder));
                  }}
                  className="text-xs underline text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  Assign to payer
                </button>
              ) : null
            }
          />
        </TabsContent>

        <TabsContent value="percentage">
          <div className="space-y-1.5">
            {members.map((m) => {
              const entry = getData(m.id);
              const pct = entry?.value ?? 0;
              const cents = Math.round((pct / 100) * amountCents);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 bg-[var(--color-secondary)]"
                >
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="flex-1 min-w-0 truncate text-sm">
                    {m.display_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
                      {formatMoney(cents, currency)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <input
                        inputMode="decimal"
                        className="h-8 w-20 bg-[var(--color-background)] rounded-md border border-[var(--color-border)] px-2 text-right tabular-nums text-sm outline-none focus:border-[var(--color-primary)]"
                        value={pct === 0 ? "" : pct}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setData(
                            m.id,
                            isNaN(v) ? 0 : Math.max(0, Math.min(100, v)),
                          );
                        }}
                      />
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <StatusBar
            ok={Math.abs(pctSum - 100) < 0.01}
            over={pctSum > 100}
            label={
              Math.abs(pctSum - 100) < 0.01
                ? "Percentages add up to 100%"
                : `Total: ${pctSum.toFixed(1)}% (need 100%)`
            }
          />
        </TabsContent>

        <TabsContent value="shares">
          <div className="space-y-1.5">
            {members.map((m) => {
              const entry = getData(m.id);
              const shares = entry?.value ?? 0;
              const cents =
                totalShares > 0
                  ? Math.round((shares / totalShares) * amountCents)
                  : 0;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 bg-[var(--color-secondary)]"
                >
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="flex-1 min-w-0 truncate text-sm">
                    {m.display_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
                      {formatMoney(cents, currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setData(m.id, Math.max(0, shares - 1))}
                        className="h-7 w-7 rounded-md border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-background)] text-sm leading-none"
                      >
                        −
                      </button>
                      <span className="w-8 text-center tabular-nums text-sm font-medium">
                        {shares}
                      </span>
                      <button
                        type="button"
                        onClick={() => setData(m.id, shares + 1)}
                        className="h-7 w-7 rounded-md border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-background)] text-sm leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <StatusBar
            ok={totalShares > 0}
            over={false}
            label={
              totalShares > 0
                ? `${totalShares} total shares`
                : "Assign at least 1 share"
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
