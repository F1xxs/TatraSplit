import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/queryKeys'
import { normalizeList } from '@/lib/normalize'

export function useGroupRecurring(groupId) {
  return useQuery({
    queryKey: qk.groupRecurring(groupId),
    queryFn: async () => normalizeList((await api.get(`/groups/${groupId}/recurring`)).data),
    enabled: !!groupId,
  })
}

export function useCreateRecurring(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post(`/groups/${groupId}/recurring`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groupRecurring(groupId) }),
  })
}

export function useDeleteRecurring(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recurringId) =>
      (await api.delete(`/groups/${groupId}/recurring/${recurringId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groupRecurring(groupId) }),
  })
}

export function useUpdateRecurring(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recurringId, ...body }) =>
      (await api.patch(`/groups/${groupId}/recurring/${recurringId}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groupRecurring(groupId) }),
  })
}

export function useProcessRecurring() {
  return useMutation({
    mutationFn: async () => (await api.post('/admin/process-recurring')).data,
  })
}
