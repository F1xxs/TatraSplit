import { type QueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

export function invalidateGlobal(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: qk.me });
  qc.invalidateQueries({ queryKey: qk.groups });
  qc.invalidateQueries({ queryKey: qk.contacts });
  qc.invalidateQueries({ queryKey: qk.users() });
}

export function invalidateGroup(qc: QueryClient, id: string): void {
  qc.invalidateQueries({ queryKey: qk.group(id) });
  qc.invalidateQueries({ queryKey: qk.groupExpenses(id) });
  qc.invalidateQueries({ queryKey: qk.groupReceipts(id) });
  qc.invalidateQueries({ queryKey: qk.groupBalances(id) });
  qc.invalidateQueries({ queryKey: qk.groupActivity(id) });
  qc.invalidateQueries({ queryKey: qk.groupTransfers(id) });
}
