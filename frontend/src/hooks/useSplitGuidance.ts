import { useMemo } from "react";
import { formatMoney } from "@/lib/format";

interface SplitBudgetStatus {
  state: "exact" | "under" | "over";
  remainderCents: number;
}

interface SplitGuidance {
  tone: string;
  text: string;
}

/**
 * Computes split guidance message (exact / under / over) for custom-split forms.
 * Returns null when guidance is not applicable.
 */
export function useSplitGuidance(
  splitType: string,
  amountCents: number,
  splitBudgetStatus: SplitBudgetStatus,
  currency: string,
): SplitGuidance | null {
  return useMemo(() => {
    if (splitType !== "custom" || amountCents <= 0) return null;
    if (splitBudgetStatus.state === "exact") {
      return {
        tone: "text-[var(--color-success)] bg-[var(--color-success)]/10",
        text: "Split is exact. Ready to save.",
      };
    }
    if (splitBudgetStatus.state === "under") {
      return {
        tone: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
        text: `${formatMoney(splitBudgetStatus.remainderCents, currency)} left to assign before saving.`,
      };
    }
    return {
      tone: "text-[var(--color-destructive)] bg-[var(--color-destructive)]/10",
      text: `${formatMoney(splitBudgetStatus.remainderCents, currency)} over budget. Reduce shares to continue.`,
    };
  }, [splitType, amountCents, splitBudgetStatus, currency]);
}
