import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { normalizeGroup, normalizeList } from "@/lib/normalize";

export function useGroups() {
  return useQuery({
    queryKey: qk.groups,
    queryFn: async () =>
      normalizeList((await api.get("/groups")).data).map(normalizeGroup),
  });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: qk.group(id || ""),
    queryFn: async () => normalizeGroup((await api.get(`/groups/${id}`)).data),
    enabled: !!id,
  });
}

export function useGroupExpenses(id: string | undefined) {
  return useQuery({
    queryKey: qk.groupExpenses(id || ""),
    queryFn: async () =>
      normalizeList((await api.get(`/groups/${id}/expenses`)).data),
    enabled: !!id,
  });
}

export function useGroupBalances(id: string | undefined) {
  return useQuery({
    queryKey: qk.groupBalances(id || ""),
    queryFn: async () => (await api.get(`/groups/${id}/balances`)).data,
    enabled: !!id,
  });
}

export function useGroupActivity(id: string | undefined) {
  return useQuery({
    queryKey: qk.groupActivity(id || ""),
    queryFn: async () =>
      normalizeList((await api.get(`/groups/${id}/activity`)).data),
    enabled: !!id,
  });
}

export function useGroupReceipts(id: string | undefined) {
  return useQuery({
    queryKey: qk.groupReceipts(id || ""),
    queryFn: async () =>
      normalizeList((await api.get(`/groups/${id}/receipts`)).data),
    enabled: !!id,
  });
}

export function useGroupTransfers(id: string | undefined) {
  return useQuery({
    queryKey: qk.groupTransfers(id || ""),
    queryFn: async () =>
      normalizeList((await api.get(`/groups/${id}/transfers`)).data),
    enabled: !!id,
  });
}

export function useUsers(q?: string) {
  const query = q?.trim() || "";
  return useQuery({
    queryKey: qk.users(query),
    queryFn: async () =>
      normalizeList(
        (await api.get("/users", query ? { params: { q: query } } : {})).data,
      ),
    staleTime: 5 * 60 * 1000,
  });
}
