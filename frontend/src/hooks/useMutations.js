import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { invalidateGlobal, invalidateGroup } from '@/lib/invalidation'
import { normalizeGroup } from '@/lib/normalize'

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => normalizeGroup((await api.post('/groups', body)).data),
    onSuccess: () => invalidateGlobal(qc),
  })
}

export function useAddExpense(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/expenses`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId)
      invalidateGlobal(qc)
    },
  })
}

export function useSettle(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/settlements`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId)
      invalidateGlobal(qc)
    },
  })
}

export function useJoinGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, as }) => {
      const qs = as ? `?as=${encodeURIComponent(as)}` : ''
      return normalizeGroup((await api.post(`/groups/join/${token}${qs}`)).data)
    },
    onSuccess: () => invalidateGlobal(qc),
  })
}
