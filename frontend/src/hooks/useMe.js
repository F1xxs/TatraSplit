import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/queryKeys'
import { normalizeEntity } from '@/lib/normalize'

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => normalizeEntity((await api.get('/users/me')).data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMeBalances() {
  return useQuery({
    queryKey: qk.meBalances,
    queryFn: async () => (await api.get('/me/balances')).data,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
}
