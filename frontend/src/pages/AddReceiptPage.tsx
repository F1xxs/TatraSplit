import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { SplitEditor } from "@/components/shared/SplitEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { useGroup } from "@/hooks/useGroups";
import { useMe } from "@/hooks/useMe";
import { useCreateReceipt, useImportReceipt, useScanReceipt } from "@/hooks/useMutations";
import { formatMoney } from "@/lib/format";
import { defaultSplitData } from "@/lib/split";
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";

interface ReceiptItem {
  name: string;
  amount_cents: number;
  splitType: string;
  splitData: any[];
}

interface ScanedItem {
  name?: string;
  amount_cents?: number;
}

interface ScanResult {
  place?: string;
  items?: ScanedItem[];
}

interface User {
  id: string;
}

function blankItem(members: any[]): ReceiptItem {
  return {
    name: "",
    amount_cents: 0,
    splitType: "equal",
    splitData: defaultSplitData("equal", members, 0),
  };
}

export const AddReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div>Group not found</div>;
  }

  const navigate = useNavigate();
  const { data: group } = useGroup(id);
  const { data: me } = useMe();
  const createReceipt = useCreateReceipt(id);
  const scanReceipt = useScanReceipt(id);
  const importReceipt = useImportReceipt(id);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const members = (group as any)?.members || [];
  const currency = (group as any)?.currency || "EUR";

  const [place, setPlace] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [defaultPayer, setDefaultPayer] = useState((me as any)?.id || "");
  const [items, setItems] = useState<ReceiptItem[]>([blankItem(members)]);

  if ((me as User)?.id && !defaultPayer) setDefaultPayer((me as User).id);

  const totalCents = items.reduce((a, i) => a + (i.amount_cents || 0), 0);

  const updateItem = (idx: number, patch: Partial<ReceiptItem>): void => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, ...patch };
        if (patch.splitType && patch.splitType !== item.splitType) {
          next.splitData = defaultSplitData(
            patch.splitType,
            members,
            next.amount_cents,
          );
        }
        if (patch.amount_cents !== undefined && patch.splitType === undefined) {
          next.splitData = defaultSplitData(
            next.splitType,
            members,
            patch.amount_cents,
          );
        }
        return next;
      }),
    );
  };

  const addItem = (): void => setItems((prev) => [...prev, blankItem(members)]);
  const removeItem = (idx: number): void =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleScan = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const data = (await scanReceipt.mutateAsync(file)) as ScanResult;
      if (data?.place) setPlace(data.place);
      if (data?.items?.length) {
        setItems(
          data.items.map((item) => ({
            name: item.name || "",
            amount_cents: item.amount_cents || 0,
            splitType: "equal",
            splitData: defaultSplitData(
              "equal",
              members,
              item.amount_cents || 0,
            ),
          })),
        );
      }
      toast({ variant: "success", title: "Receipt scanned" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not scan receipt",
        description: err.message,
      });
    }
  };

  const handleImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const data = await importReceipt.mutateAsync(file);
      if (data.place) setPlace(data.place);
      if (data.location) setLocation(data.location);
      if (data.date) setDate(data.date);
      if (data.items?.length) {
        setItems(
          data.items.map((item: any) => ({
            name: item.description || "",
            amount_cents: item.amount_cents || 0,
            splitType: item.split?.type || "equal",
            splitData: item.split?.members?.length
              ? item.split.members
              : defaultSplitData("equal", members, item.amount_cents || 0),
          })),
        );
      }
      toast({ variant: "success", title: "Receipt imported" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not import receipt",
        description: err.message,
      });
    }
  };

  const canSubmit =
    items.length > 0 &&
    items.every(
      (item) =>
        item.name.trim() && item.amount_cents > 0 && item.splitData.length > 0,
    );

  const submit = async (): Promise<void> => {
    try {
      await createReceipt.mutateAsync({
        place: place.trim(),
        location: location.trim(),
        date: date || null,
        metadata: {
          members: members.map((m: any) => m.id),
          default_payer: defaultPayer || null,
          total_cents: totalCents,
        },
        items: items.map((item) => ({
          name: item.name.trim(),
          amount_cents: item.amount_cents,
          split: { type: item.splitType, members: item.splitData },
        })),
      });
      toast({ variant: "success", title: "Receipt saved" });
      navigate(`/groups/${id}`);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not save receipt",
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
        <h1 className="text-xl font-semibold tracking-tight">Add receipt</h1>
        <div className="flex gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleImport}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => importRef.current?.click()}
            disabled={importReceipt.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            {importReceipt.isPending ? "Importing…" : "Import"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleScan}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={scanReceipt.isPending}
          >
            {scanReceipt.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…
              </>
            ) : (
              <>
                <ImageIcon className="h-3.5 w-3.5" /> Scan receipt
              </>
            )}
          </Button>
        </div>
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
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
                {m.id === (me as any)?.id ? " (you)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              Total: <strong>{formatMoney(totalCents, currency)}</strong>
            </span>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  className="flex-1"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="shrink-0 p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div>
                <Label className="text-xs text-[var(--color-muted-foreground)]">
                  Amount
                </Label>
                <div className="mt-1 rounded-xl bg-[var(--color-secondary)] py-4">
                  <MoneyInput
                    value={item.amount_cents}
                    onChange={(v) => updateItem(idx, { amount_cents: v })}
                    currency={currency}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[var(--color-muted-foreground)]">
                  Split
                </Label>
                <div className="mt-1">
                  <SplitEditor
                    members={members}
                    amountCents={item.amount_cents}
                    currency={currency}
                    splitType={item.splitType}
                    onSplitTypeChange={(type) =>
                      updateItem(idx, { splitType: type })
                    }
                    splitData={item.splitData}
                    onSplitDataChange={(data) =>
                      updateItem(idx, { splitData: data })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate(`/groups/${id}`)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit || createReceipt.isPending}
          >
            {createReceipt.isPending
              ? "Saving…"
              : `Save receipt · ${formatMoney(totalCents, currency)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
