import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, setUserHandle } from "@/lib/api";
import { invalidateGlobal, invalidateGroup } from "@/lib/invalidation";
import { normalizeGroup } from "@/lib/normalize";
import { qk } from "@/lib/queryKeys";

interface User {
  handle: string;
  [key: string]: unknown;
}

interface GroupBody {
  [key: string]: unknown;
}

interface ExpenseBody {
  expenseId?: string;
  [key: string]: unknown;
}

interface TransferBody {
  transferId?: string;
  [key: string]: unknown;
}

interface ReceiptBody {
  receiptId?: string;
  [key: string]: unknown;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle: string) =>
      (await api.post("/auth/login", { handle })).data as User,
    onSuccess: (user) => {
      setUserHandle(user.handle);
      invalidateGlobal(qc);
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: GroupBody) =>
      normalizeGroup((await api.post("/groups", body)).data),
    onSuccess: () => invalidateGlobal(qc),
  });
}

export function useDeleteGroup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.delete(`/groups/${groupId}`)).data,
    onSuccess: () => invalidateGlobal(qc),
  });
}

export function useAddGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      (await api.post(`/groups/${groupId}/members`, { user_id: userId })).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      (await api.delete(`/groups/${groupId}/members/${userId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useAddExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ExpenseBody) =>
      (await api.post(`/groups/${groupId}/expenses`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function usePatchExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ expenseId, ...body }: ExpenseBody) =>
      (await api.patch(`/groups/${groupId}/expenses/${expenseId}`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: string) =>
      (await api.delete(`/groups/${groupId}/expenses/${expenseId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useScanReceipt(groupId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/groups/${groupId}/expenses/scan`, form)).data;
    },
  });
}

export function useImportExpense(groupId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/groups/${groupId}/import/expense`, form)).data;
    },
  });
}

export function useCreateTransfer(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransferBody) =>
      (await api.post(`/groups/${groupId}/transfers`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function usePatchTransfer(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transferId, ...body }: TransferBody) =>
      (await api.patch(`/groups/${groupId}/transfers/${transferId}`, body))
        .data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useDeleteTransfer(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) =>
      (await api.delete(`/groups/${groupId}/transfers/${transferId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
      invalidateGlobal(qc);
    },
  });
}

export function useImportReceipt(groupId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/groups/${groupId}/import/receipt`, form)).data;
    },
  });
}

export function useCreateReceipt(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ReceiptBody) =>
      (await api.post(`/groups/${groupId}/receipts`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
    },
  });
}

export function usePatchReceipt(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ receiptId, ...body }: ReceiptBody) =>
      (await api.patch(`/groups/${groupId}/receipts/${receiptId}`, body)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
    },
  });
}

export function useDeleteReceipt(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (receiptId: string) =>
      (await api.delete(`/groups/${groupId}/receipts/${receiptId}`)).data,
    onSuccess: () => {
      invalidateGroup(qc, groupId);
    },
  });
}

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle: string) =>
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
    mutationFn: async (contactId: string) =>
      (await api.delete(`/contacts/${contactId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts });
      qc.invalidateQueries({ queryKey: qk.users() });
    },
  });
}
