import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/queryKeys'
import { normalizeList } from '@/lib/normalize'

export function useContacts() {
  return useQuery({
    queryKey: qk.contacts,
    queryFn: async () => (await api.get('/contacts')).data,
  })
}

export function useAddContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post('/contacts', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts })
      qc.invalidateQueries({ queryKey: qk.users() })
    },
  })
}

export function useRemoveContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contactId) => (await api.delete(`/contacts/${contactId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts })
      qc.invalidateQueries({ queryKey: qk.users() })
    },
  })
}

export function useUserSearch(query) {
  const q = query?.trim() || ''
  return useQuery({
    queryKey: qk.users(q),
    queryFn: async () => normalizeList((await api.get('/users', { params: { q } })).data),
    enabled: q.length > 0,
    staleTime: 60 * 1000,
  })
}
