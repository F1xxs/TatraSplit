import React, { useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CategoryPicker } from "@/components/shared/CategoryPicker";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { SplitEditor } from "@/components/shared/SplitEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { useGroup } from "@/hooks/useGroups";
import { useMe } from "@/hooks/useMe";
import { useAddExpense, useImportExpense } from "@/hooks/useMutations";
import { getCategory } from "@/lib/format";
import { defaultSplitData } from "@/lib/split";
import { ArrowLeft, Upload } from "lucide-react";

interface SplitData {
  user_id: string;
  value: number;
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

export const AddExpensePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div>Group not found</div>;
  }

  const [searchParams] = useSearchParams();
  const receiptId = searchParams.get("receipt_id");
  const backTo = searchParams.get("backTo") || `/groups/${id}`;
  const navigate = useNavigate();
  const { data: group } = useGroup(id);
  const { data: me } = useMe();
  const addExpense = useAddExpense(id);
  const { toast } = useToast();

  const importExpense = useImportExpense(id);
  const fileRef = useRef<HTMLInputElement>(null);

  const members = (group as any)?.members || [];
  const currency = (group as any)?.currency || "EUR";

  const [description, setDescription] = useState(getCategory("food").label);
  const [category, setCategory] = useState("food");

  const handleCategoryChange = (cat: string): void => {
    if (description === getCategory(category).label)
      setDescription(getCategory(cat).label);
    setCategory(cat);
  };

  const [amount, setAmount] = useState(0);
  const [paidBy, setPaidBy] = useState((me as any)?.id || "");
  const [splitType, setSplitType] = useState("equal");
  const [splitData, setSplitData] = useState<SplitData[]>(() =>
    (defaultSplitData("equal", members, 0) as any) as SplitData[],
  );

  // keep paid_by in sync when me loads
  if ((me as any)?.id && !paidBy) setPaidBy((me as any).id);

  // reinit splitData when members load or splitType changes externally
  const handleSplitTypeChange = (type: string): void => {
    setSplitType(type);
    setSplitData((defaultSplitData(type, members, amount) as any) as SplitData[]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const data = await importExpense.mutateAsync(file);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.amount_cents) {
        const newSplitType = data.split?.type ?? splitType;
        setAmount(data.amount_cents);
        setSplitData(defaultSplitData(newSplitType, members, data.amount_cents) as SplitData[]);
      }
      if (data.paid_by) setPaidBy(data.paid_by);
      if (data.split) {
        setSplitType(data.split.type);
        setSplitData(data.split.members as SplitData[]);
      }
      toast({ variant: "success", title: "Expense imported" });
    } catch (err: any) {
      toast({ variant: "error", title: "Could not import expense", description: err.message });
    }
  };

  const canSubmit =
    !!description.trim() &&
    amount > 0 &&
    !!paidBy &&
    members.length > 0 &&
    isSplitValid(splitType, splitData, amount);

  const submit = async (): Promise<void> => {
    try {
      await addExpense.mutateAsync({
        description: description.trim(),
        category,
        amount_cents: amount,
        paid_by: paidBy,
        split: { type: splitType, members: splitData },
        receipt_id: receiptId || null,
        note: "",
      });
      toast({ variant: "success", title: "Expense added" });
      navigate(backTo);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not add expense",
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
        <h1 className="text-xl font-semibold tracking-tight">
          {receiptId ? "Add receipt item" : "Add expense"}
        </h1>
        {!receiptId && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.yaml,.yml"
              className="sr-only"
              onChange={handleImport}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={importExpense.isPending}
            >
              <Upload className="h-3.5 w-3.5" />
              {importExpense.isPending ? "Importing…" : "Import"}
            </Button>
          </>
        )}
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
              autoFocus
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
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
                {m.id === (me as any)?.id ? " (you)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Split</Label>
          <div className="mt-2">
            <SplitEditor
              members={members as any}
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
            disabled={!canSubmit || addExpense.isPending}
          >
            {addExpense.isPending ? "Saving…" : "Add expense"}
          </Button>
        </div>
      </div>
    </div>
  );
};
