import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { SplitEditor } from "@/components/shared/SplitEditor";
import { CategoryPicker } from "@/components/shared/CategoryPicker";
import { useGroup, useGroupExpenses } from "@/hooks/useGroups";
import { usePatchExpense, useDeleteExpense } from "@/hooks/useMutations";
import { useMe } from "@/hooks/useMe";
import { useToast } from "@/components/ui/toaster";
import { getCategory } from "@/lib/format";
import { defaultSplitData } from "@/lib/split";

interface SplitData {
  user_id: string;
  value: number;
}

interface Member {
  id: string;
  display_name: string;
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amount_cents: number;
  paid_by: string;
  split?: {
    type: string;
    members: SplitData[];
  };
}

interface User {
  id: string;
}

interface EditExpenseFormProps {
  expense: Expense;
  members: Member[];
  currency: string;
  id?: string;
  backTo: string;
  me?: User;
}

function isSplitValid(
  splitType: string,
  splitData: SplitData[],
  amountCents: number,
): boolean {
  if (!splitData.length) return false;
  if (splitType === "equal") return splitData.some((s) => s.value > 0);
  const sum = splitData.reduce((a, s) => a + (s.value || 0), 0);
  if (splitType === "custom") return Math.abs(sum - amountCents) < 1;
  if (splitType === "percentage") return Math.abs(sum - 100) < 0.01;
  if (splitType === "shares") return sum > 0;
  return false;
}

const EditExpenseForm: React.FC<EditExpenseFormProps> = ({
  expense,
  members,
  currency,
  id,
  backTo,
  me,
}) => {
  if (!id) {
    return <div>Error: No expense ID</div>;
  }

  const navigate = useNavigate();
  const patchExpense = usePatchExpense(id);
  const deleteExpense = useDeleteExpense(id);
  const { toast } = useToast();

  const type = expense.split?.type || "equal";
  const [description, setDescription] = useState(expense.description || "");
  const [category, setCategory] = useState(expense.category || "food");
  const [amount, setAmount] = useState(expense.amount_cents || 0);
  const [paidBy, setPaidBy] = useState(expense.paid_by || "");
  const [splitType, setSplitType] = useState(type);
  const [splitData, setSplitData] = useState<SplitData[]>(
    ((expense.split?.members as any) ||
      (defaultSplitData(type, members, expense.amount_cents || 0) as any)) as SplitData[],
  );

  const handleCategoryChange = (cat: string): void => {
    if (description === getCategory(category).label)
      setDescription(getCategory(cat).label);
    setCategory(cat);
  };

  const handleSplitTypeChange = (t: string): void => {
    setSplitType(t);
    setSplitData((defaultSplitData(t, members, amount) as any) as SplitData[]);
  };

  const canSubmit =
    !!description.trim() &&
    amount > 0 &&
    !!paidBy &&
    members.length > 0 &&
    isSplitValid(splitType, splitData, amount);

  const submit = async (): Promise<void> => {
    try {
      await patchExpense.mutateAsync({
        expenseId: expense.id,
        description: description.trim(),
        category,
        amount_cents: amount,
        paid_by: paidBy,
        split: { type: splitType, members: splitData },
      });
      toast({ variant: "success", title: "Expense updated" });
      navigate(backTo);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not update expense",
        description: err.message,
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast({ variant: "success", title: "Expense deleted" });
      navigate(backTo);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not delete expense",
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Edit expense</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteExpense.isPending}
        >
          {deleteExpense.isPending ? "Deleting…" : "Delete"}
        </Button>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Amount</Label>
          <div className="mt-2 rounded-2xl bg-[var(--color-secondary)] py-8">
            <MoneyInput
              value={amount}
              onChange={(v) => {
                setAmount(v);
                setSplitData((defaultSplitData(splitType, members, v) as any) as SplitData[]);
              }}
              currency={currency}
            />
            <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">
              {currency}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="desc">Description</Label>
          <Input
            id="desc"
            className="mt-2"
            placeholder="Groceries, dinner, tickets…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Category</Label>
          <div className="mt-2">
            <CategoryPicker value={category} onChange={handleCategoryChange} />
          </div>
        </div>

        <div>
          <Label htmlFor="paidBy">Paid by</Label>
          <select
            id="paidBy"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
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
          <Label>Split</Label>
          <div className="mt-2">
            <SplitEditor
              members={members}
              amountCents={amount}
              currency={currency}
              splitType={splitType}
              onSplitTypeChange={handleSplitTypeChange}
              splitData={splitData}
              onSplitDataChange={(data: any) => setSplitData(data as SplitData[])}
              payerId={paidBy}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit || patchExpense.isPending}
          >
            {patchExpense.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const EditExpensePage: React.FC = () => {
  const { id, expId } = useParams<{ id: string; expId: string }>();
  const [searchParams] = useSearchParams();
  const backTo = searchParams.get("backTo") || `/groups/${id}`;
  const navigate = useNavigate();
  const { data: group } = useGroup(id);
  const { data: expenses = [] } = useGroupExpenses(id);
  const { data: me } = useMe();

  const expense = expenses.find((e) => e.id === expId);
  const members = (group as any)?.members || [];
  const currency = (group as any)?.currency || "EUR";

  if (!expense) {
    if (expenses.length > 0) {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Expense not found.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <EditExpenseForm
      key={expense.id}
      expense={expense as any}
      members={members}
      currency={currency}
      id={id}
      backTo={backTo}
      me={me}
    />
  );
};
