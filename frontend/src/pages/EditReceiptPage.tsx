import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGroup,
  useGroupReceipts,
  useGroupExpenses,
} from "@/hooks/useGroups";
import { usePatchReceipt, useDeleteReceipt } from "@/hooks/useMutations";
import { useMe } from "@/hooks/useMe";
import { useToast } from "@/components/ui/toaster";
import { formatMoney } from "@/lib/format";

interface Member {
  id: string;
  display_name: string;
}

interface Expense {
  id: string;
  description: string;
  amount_cents: number;
  paid_by: string;
}

interface Receipt {
  id: string;
  place: string;
  location: string;
  date: string;
  metadata?: {
    default_payer?: string;
  };
}

interface User {
  id: string;
}

interface EditReceiptFormProps {
  receipt: Receipt;
  members: Member[];
  currency: string;
  id?: string;
  me?: User;
  items: Expense[];
}

const EditReceiptForm: React.FC<EditReceiptFormProps> = ({
  receipt,
  members,
  currency,
  id,
  me,
  items,
}) => {
  if (!id) {
    return <div>Error: No receipt ID</div>;
  }

  const navigate = useNavigate();
  const patchReceipt = usePatchReceipt(id);
  const deleteReceipt = useDeleteReceipt(id);
  const { toast } = useToast();

  const [place, setPlace] = useState(receipt.place || "");
  const [location, setLocation] = useState(receipt.location || "");
  const [date, setDate] = useState(receipt.date || "");
  const [defaultPayer, setDefaultPayer] = useState(
    receipt.metadata?.default_payer || "",
  );

  const totalCents = items.reduce((a, e) => a + (e.amount_cents || 0), 0);

  const backTo = `/groups/${id}/receipts/${receipt.id}/edit`;
  const addItemUrl = `/groups/${id}/expenses/new?receipt_id=${receipt.id}&backTo=${encodeURIComponent(backTo)}`;
  const editItemUrl = (expId: string): string =>
    `/groups/${id}/expenses/${expId}/edit?backTo=${encodeURIComponent(backTo)}`;

  const submit = async (): Promise<void> => {
    try {
      await patchReceipt.mutateAsync({
        receiptId: receipt.id,
        place: place.trim(),
        location: location.trim(),
        date: date || null,
        metadata: {
          members: members.map((m) => m.id),
          default_payer: defaultPayer || null,
          total_cents: totalCents,
        },
      });
      toast({ variant: "success", title: "Receipt updated" });
      navigate(`/groups/${id}`);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not update receipt",
        description: err.message,
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await deleteReceipt.mutateAsync(receipt.id);
      toast({ variant: "success", title: "Receipt deleted" });
      navigate(`/groups/${id}`);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not delete receipt",
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(`/groups/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Edit receipt</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteReceipt.isPending}
        >
          {deleteReceipt.isPending ? "Deleting…" : "Delete"}
        </Button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="place">Place</Label>
            <Input
              id="place"
              className="mt-2"
              placeholder="Restaurant, supermarket…"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              className="mt-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            className="mt-2"
            placeholder="Address or city (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="defaultPayer">Default payer</Label>
          <select
            id="defaultPayer"
            value={defaultPayer}
            onChange={(e) => setDefaultPayer(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">None</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
                {m.id === me?.id ? " (you)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(`/groups/${id}`)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={patchReceipt.isPending}>
            {patchReceipt.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Items</h2>
          <span className="text-sm text-[var(--color-muted-foreground)]">
            Total: <strong>{formatMoney(totalCents, currency)}</strong>
          </span>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No items yet.
          </p>
        )}

        {items.map((expense) => {
          const payer = members.find((m) => m.id === expense.paid_by);
          return (
            <button
              key={expense.id}
              type="button"
              onClick={() => navigate(editItemUrl(expense.id))}
              className="w-full flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-left hover:bg-[var(--color-secondary)] transition-colors"
            >
              <Receipt className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {expense.description}
                </p>
                {payer && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    paid by {payer.id === me?.id ? "you" : payer.display_name}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium shrink-0">
                {formatMoney(expense.amount_cents, currency)}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
            </button>
          );
        })}

        <Button
          variant="outline"
          onClick={() => navigate(addItemUrl)}
          className="w-full"
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>
    </div>
  );
};

export const EditReceiptPage: React.FC = () => {
  const { id, receiptId } = useParams<{ id: string; receiptId: string }>();
  const navigate = useNavigate();
  const { data: group } = useGroup(id);
  const { data: receipts = [] } = useGroupReceipts(id);
  const { data: expenses = [] } = useGroupExpenses(id);
  const { data: me } = useMe();

  const receipt = receipts.find((r) => r.id === receiptId);
  const members = (group as any)?.members || [];
  const currency = (group as any)?.currency || "EUR";
  const items = expenses.filter((e) => e.receipt_id === receiptId);

  if (!receipt) {
    if (receipts.length > 0) {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate(`/groups/${id}`)}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Receipt not found.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <EditReceiptForm
      key={receipt.id}
      receipt={receipt as any}
      members={members}
      currency={currency}
      id={id}
      me={me}
      items={items as any}
    />
  );
};
