import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, setUserHandle } from "@/lib/api";
import { invalidateGlobal, invalidateGroup } from "@/lib/invalidation";
import { normalizeGroup } from "@/lib/normalize";
import { qk } from "@/lib/queryKeys";

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle) =>
      (await api.post("/auth/login", { handle })).data,
    onSuccess: (user) => {
      setUserHandle(user.handle);
      invalidateGlobal(qc);
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      normalizeGroup((await api.post("/groups", body)).data),
    onSuccess: () => invalidateGlobal(qc),
  });
}

export function useDeleteGroup(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.delete(`/groups/${groupId}`)).data,
    onSuccess: () => invalidateGlobal(qc),
  });
}

export function useAddGroupMember(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId) =>
      (await api.post(`/groups/${groupId}/members`, { user_id: userId })).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useRemoveGroupMember(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId) =>
      (await api.delete(`/groups/${groupId}/members/${userId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useAddExpense(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/expenses`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function usePatchExpense(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ expenseId, ...body }) =>
      (await api.patch(`/groups/${groupId}/expenses/${expenseId}`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useDeleteExpense(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId) =>
      (await api.delete(`/groups/${groupId}/expenses/${expenseId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useScanReceipt(groupId) {
  return useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/groups/${groupId}/expenses/scan`, form)).data;
    },
  });
}

export function useCreateTransfer(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/transfers`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function usePatchTransfer(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transferId, ...body }) =>
      (await api.patch(`/groups/${groupId}/transfers/${transferId}`, body))
        .data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useDeleteTransfer(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId) =>
      (await api.delete(`/groups/${groupId}/transfers/${transferId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useCreateReceipt(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/groups/${groupId}/receipts`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
    },
  });
}

export function usePatchReceipt(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ receiptId, ...body }) =>
      (await api.patch(`/groups/${groupId}/receipts/${receiptId}`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
    },
  });
}

export function useDeleteReceipt(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (receiptId) =>
      (await api.delete(`/groups/${groupId}/receipts/${receiptId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
    },
  });
}

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle) =>
      (await api.post("/contacts", { handle })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts });
      qc.invalidateQueries({ queryKey: qk.users() });
    },
  });
}

export function useRemoveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId) =>
      (await api.delete(`/contacts/${contactId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts });
      qc.invalidateQueries({ queryKey: qk.users() });
    },
  });
}
