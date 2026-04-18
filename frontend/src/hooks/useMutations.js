import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/queryKeys'

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post('/groups', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groups })
      qc.invalidateQueries({ queryKey: qk.meBalances })
      qc.invalidateQueries({ queryKey: qk.activity })
    },
  })
}

export function useAddExpense(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/expenses`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.group(groupId) })
      qc.invalidateQueries({ queryKey: qk.groupExpenses(groupId) })
      qc.invalidateQueries({ queryKey: qk.groupBalances(groupId) })
      qc.invalidateQueries({ queryKey: qk.groupActivity(groupId) })
      qc.invalidateQueries({ queryKey: qk.meBalances })
      qc.invalidateQueries({ queryKey: qk.groups })
      qc.invalidateQueries({ queryKey: qk.activity })
    },
  })
}

export function useSettle(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/settlements`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.group(groupId) })
      qc.invalidateQueries({ queryKey: qk.groupBalances(groupId) })
      qc.invalidateQueries({ queryKey: qk.groupActivity(groupId) })
      qc.invalidateQueries({ queryKey: qk.meBalances })
      qc.invalidateQueries({ queryKey: qk.groups })
      qc.invalidateQueries({ queryKey: qk.activity })
    },
  })
}

export function useJoinGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, as }) => {
      const qs = as ? `?as=${encodeURIComponent(as)}` : ''
      return (await api.post(`/groups/join/${token}${qs}`)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groups })
      qc.invalidateQueries({ queryKey: qk.meBalances })
      qc.invalidateQueries({ queryKey: qk.activity })
    },
  })
}
