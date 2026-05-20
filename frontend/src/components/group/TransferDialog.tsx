import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/MoneyInput";
import {
  useCreateTransfer,
  usePatchTransfer,
  useDeleteTransfer,
} from "@/hooks/useMutations";
import { useToast } from "@/components/ui/toaster";
import { ChangeEvent } from "react";

interface User {
  id: string;
  display_name: string;
  [key: string]: any;
}

interface Transfer {
  id: string;
  from_user: string;
  to_user: string;
  amount_cents: number;
  note?: string;
  [key: string]: any;
}

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Transfer;
  members: User[];
  groupId: string;
  currency: string;
  me?: User;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onOpenChange,
  initial,
  members,
  groupId,
  currency,
  me,
}) => {
  const isEdit = !!initial?.id;
  const createTransfer = useCreateTransfer(groupId);
  const patchTransfer = usePatchTransfer(groupId);
  const deleteTransfer = useDeleteTransfer(groupId);
  const { toast } = useToast();

  const [fromUser, setFromUser] = useState(initial?.from_user || me?.id || "");
  const [toUser, setToUser] = useState(initial?.to_user || "");
  const [amount, setAmount] = useState(initial?.amount_cents || 0);
  const [note, setNote] = useState(initial?.note || "");

  const submit = async () => {
    try {
      if (isEdit) {
        await patchTransfer.mutateAsync({
          transferId: initial!.id,
          amount_cents: amount,
          note,
        });
        toast({ variant: "success", title: "Transfer updated" });
      } else {
        await createTransfer.mutateAsync({
          from_user: fromUser,
          to_user: toUser,
          amount_cents: amount,
          note,
        });
        toast({ variant: "success", title: "Transfer recorded" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "error",
        title: isEdit ? "Could not update" : "Could not record transfer",
        description: err.message,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTransfer.mutateAsync(initial!.id);
      toast({ variant: "success", title: "Transfer deleted" });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not delete",
        description: err.message,
      });
    }
  };

  const isPending = isEdit ? patchTransfer.isPending : createTransfer.isPending;
  const canSubmit =
    amount > 0 && (isEdit || (fromUser && toUser && fromUser !== toUser));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit transfer" : "Record transfer"}
          </DialogTitle>
          <DialogDescription>
            Manual member-to-member payment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!isEdit && (
            <>
              <div>
                <Label htmlFor="from">From</Label>
                <select
                  id="from"
                  value={fromUser}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFromUser(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                      {m.id === me?.id ? " (you)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <select
                  id="to"
                  value={toUser}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setToUser(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Select member</option>
                  {members
                    .filter((m) => m.id !== fromUser)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
          <div>
            <Label>Amount</Label>
            <div className="mt-2 rounded-2xl bg-[var(--color-secondary)] py-6">
              <MoneyInput
                value={amount}
                onChange={setAmount}
                currency={currency}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              className="mt-2"
              placeholder="e.g. Cash payment"
              value={note}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNote(e.target.value)
              }
            />
          </div>
        </div>
        <DialogFooter>
          {isEdit && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteTransfer.isPending}
              className="mr-auto text-red-500 hover:text-red-500 hover:bg-red-500/10"
            >
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
