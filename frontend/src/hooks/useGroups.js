import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/queryKeys'
import { normalizeGroup, normalizeList } from '@/lib/normalize'

export function useGroups() {
  return useQuery({
    queryKey: qk.groups,
    queryFn: async () => {
      const groups = normalizeList((await api.get('/groups')).data).map(normalizeGroup)
      if (!groups.some((g) => g?.net_cents == null)) return groups

      const meBalances = (await api.get('/me/balances')).data
      const netByGroup = new Map(
        (meBalances?.by_group || []).map((row) => [row.group_id, row.net_cents ?? 0]),
      )
      return groups.map((g) =>
        g?.net_cents == null ? { ...g, net_cents: netByGroup.get(g.id) ?? 0 } : g,
      )
    },
  })
}

export function useGroup(id) {
  return useQuery({
    queryKey: qk.group(id),
    queryFn: async () => normalizeGroup((await api.get(`/groups/${id}`)).data),
    enabled: !!id,
  })
}

export function useGroupExpenses(id) {
  return useQuery({
    queryKey: qk.groupExpenses(id),
    queryFn: async () => normalizeList((await api.get(`/groups/${id}/expenses`)).data),
    enabled: !!id,
  })
}

export function useGroupBalances(id) {
  return useQuery({
    queryKey: qk.groupBalances(id),
    queryFn: async () => (await api.get(`/groups/${id}/balances`)).data,
    enabled: !!id,
  })
}

export function useGroupActivity(id) {
  return useQuery({
    queryKey: qk.groupActivity(id),
    queryFn: async () => normalizeList((await api.get(`/groups/${id}/activity`)).data),
    enabled: !!id,
  })
}

export function useGroupSettlements(id) {
  return useQuery({
    queryKey: qk.groupSettlements(id),
    queryFn: async () => normalizeList((await api.get(`/groups/${id}/settlements`)).data),
    enabled: !!id,
  })
}

export function useActivity() {
  return useQuery({
    queryKey: qk.activity,
    queryFn: async () => normalizeList((await api.get('/activity')).data),
  })
}

export function useUsers() {
  return useQuery({
    queryKey: qk.users(),
    queryFn: async () => normalizeList((await api.get('/users')).data),
    staleTime: 5 * 60 * 1000,
  })
}
