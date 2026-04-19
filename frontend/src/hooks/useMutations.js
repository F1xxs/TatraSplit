import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { invalidateGlobal, invalidateGroup } from '@/lib/invalidation'
import { normalizeGroup } from '@/lib/normalize'

function extractId(entity) {
  if (!entity || typeof entity !== 'object') return null
  if (typeof entity.id === 'string') return entity.id
  if (typeof entity._id === 'string') return entity._id
  return null
}

function getGroupMemberIds(group) {
  const fromMemberIds = Array.isArray(group?.member_ids)
    ? group.member_ids.filter((id) => typeof id === 'string')
    : []

  const fromMembers = Array.isArray(group?.members)
    ? group.members.map((m) => extractId(m)).filter(Boolean)
    : []

  return Array.from(new Set([...fromMemberIds, ...fromMembers]))
}

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

export function usePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => {
      const {
        from_user,
        to_user,
        amount_cents,
        currency = 'EUR',
        note = '',
        group_id,
        to_handle,
      } = body

      if (!from_user || !to_user) {
        throw new Error('Both sender and recipient are required')
      }
      if (from_user === to_user) {
        throw new Error('Cannot send payment to yourself')
      }
      if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
        throw new Error('Amount must be a positive integer in cents')
      }

      let targetGroupId = group_id

      if (!targetGroupId) {
        const groups = (await api.get('/groups')).data ?? []
        const existing = groups.find((g) => {
          const memberIds = getGroupMemberIds(g)
          return memberIds.length === 2 && memberIds.includes(from_user) && memberIds.includes(to_user)
        })

        if (existing) {
          targetGroupId = extractId(existing)
        } else {
          if (!to_handle) {
            throw new Error('Recipient handle is required for standalone payment')
          }
          const created = (await api.post('/groups', {
            name: 'Direct Payments',
            emoji: '💸',
            currency,
            member_handles: [to_handle],
            is_direct: true,
          })).data
          targetGroupId = extractId(created)
        }
      }

      if (!targetGroupId) {
        throw new Error('Could not resolve payment group')
      }

      const settlement = (await api.post(`/groups/${targetGroupId}/settlements`, {
        from_user,
        to_user,
        amount_cents,
        currency,
        method: 'in_app',
        note,
      })).data

      return { settlement, group_id: targetGroupId }
    },
    onSuccess: ({ group_id }) => {
      if (group_id) invalidateGroup(qc, group_id)
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

export function usePaymentExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      group_id,
      participant_handles,
      amount_cents,
      currency = 'EUR',
      description,
      category = 'other',
      split_type = 'equal',
      custom_split = [],
      paid_by,
    }) => {
      let targetGroupId = group_id

      if (!targetGroupId) {
        const created = (await api.post('/groups', {
          name: description || 'Split Payment',
          emoji: '💸',
          currency,
          member_handles: participant_handles,
        })).data
        targetGroupId = extractId(created)
      }

      if (!targetGroupId) throw new Error('Could not resolve group for expense')

      const expense = (await api.post(`/groups/${targetGroupId}/expenses`, {
        description,
        category,
        amount_cents,
        currency,
        paid_by,
        split_type,
        custom_split: split_type === 'equal' ? [] : custom_split,
      })).data

      return { expense, group_id: targetGroupId }
    },
    onSuccess: ({ group_id }) => {
      if (group_id) invalidateGroup(qc, group_id)
      invalidateGlobal(qc)
    },
  })
}

export function useDeleteGroup(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.delete(`/groups/${groupId}`)).data,
    onSuccess: () => invalidateGlobal(qc),
  })
}

export function useAddGroupMember(groupId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId) => (await api.post(`/groups/${groupId}/members`, { user_id: userId })).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId)
      invalidateGlobal(qc)
    },
  })
}

export function useRespondGroupInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ inviteId, action = 'accept' }) =>
      (await api.post(`/groups/invites/${inviteId}/${action}`)).data,
    onSuccess: () => {
      invalidateGlobal(qc)
    },
  })
}
