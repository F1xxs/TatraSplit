import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/queryKeys'
import { invalidateGroup, invalidateGlobal } from '@/lib/invalidation'

export function useJar(groupId) {
  return useQuery({
    queryKey: qk.groupJar(groupId),
    queryFn: async () => (await api.get(`/groups/${groupId}/jar`)).data,
    enabled: !!groupId,
  })
}

export function useContributeJar(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (amount_cents) =>
      (await api.post(`/groups/${groupId}/jar/contribute`, { amount_cents })).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId)
      qc.invalidateQueries({ queryKey: qk.groupJar(groupId) })
    },
  })
}

export function useWithdrawJar(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ amount_cents, note = '' }) =>
      (await api.post(`/groups/${groupId}/jar/withdraw`, { amount_cents, note })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groupJar(groupId) })
      invalidateGroup(qc, groupId)
      invalidateGlobal(qc)
    },
  })
}

export function useCloseJar(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post(`/groups/${groupId}/jar/close`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId)
      invalidateGlobal(qc)
      qc.invalidateQueries({ queryKey: qk.groupJar(groupId) })
    },
  })
}
