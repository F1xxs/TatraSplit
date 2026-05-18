import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor, defaultSplitData } from '@/components/shared/SplitEditor'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
import { useGroup } from '@/hooks/useGroups'
import { useAddExpense, useScanReceipt } from '@/hooks/useMutations'
import { useMe } from '@/hooks/useMe'
import { useToast } from '@/components/ui/toaster'
import { formatMoney } from '@/lib/format'

function blankItem(members) {
  return {
    name: '',
    amount_cents: 0,
    split_type: 'equal',
    split_data: defaultSplitData('equal', members, 0),
  }
}

function isItemValid(item, members) {
  return item.name.trim() && item.amount_cents > 0 && item.split_data.length > 0
}

export function AddReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: group } = useGroup(id)
  const { data: me } = useMe()
  const addExpense = useAddExpense(id)
  const scanReceipt = useScanReceipt(id)
  const { toast } = useToast()
  const fileRef = useRef(null)

  const members = group?.members || []
  const currency = group?.currency || 'EUR'

  const [description, setDescription] = useState('Receipt')
  const [category, setCategory] = useState('food')
  const [paidBy, setPaidBy] = useState(me?.id || '')
  const [items, setItems] = useState([blankItem(members)])

  if (me?.id && !paidBy) setPaidBy(me.id)

  const totalCents = items.reduce((a, i) => a + (i.amount_cents || 0), 0)

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item
      const next = { ...item, ...patch }
      // reinit split_data when split_type changes
      if (patch.split_type && patch.split_type !== item.split_type) {
        next.split_data = defaultSplitData(patch.split_type, members, next.amount_cents)
      }
      // reinit split_data when amount changes (for equal/percentage split display)
      if (patch.amount_cents !== undefined && patch.split_type === undefined) {
        next.split_data = defaultSplitData(next.split_type, members, patch.amount_cents)
      }
      return next
    }))
  }

  const addItem = () => setItems((prev) => [...prev, blankItem(members)])
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const data = await scanReceipt.mutateAsync(file)
      if (data?.description) setDescription(data.description)
      if (data?.items?.length) {
        setItems(
          data.items.map((item) => ({
            name: item.name || '',
            amount_cents: item.amount_cents || 0,
            split_type: 'equal',
            split_data: defaultSplitData('equal', members, item.amount_cents || 0),
          })),
        )
      }
      toast({ variant: 'success', title: 'Receipt scanned' })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not scan receipt', description: err.message })
    }
  }

  const canSubmit =
    !!description.trim() &&
    !!paidBy &&
    items.length > 0 &&
    items.every((item) => isItemValid(item, members))

  const submit = async () => {
    try {
      await addExpense.mutateAsync({
        description: description.trim(),
        category,
        expense_type: 'receipt',
        amount_cents: totalCents,
        paid_by: paidBy,
        split_type: 'equal',
        split_data: [],
        items: items.map((item) => ({
          name: item.name.trim(),
          amount_cents: item.amount_cents,
          split_type: item.split_type,
          split_data: item.split_data,
        })),
      })
      toast({ variant: 'success', title: 'Receipt expense added' })
      navigate(`/groups/${id}`)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add receipt', description: err.message })
    }
  }

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
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleScan} />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={scanReceipt.isPending}
        >
          {scanReceipt.isPending ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…</>
          ) : (
            <><ImageIcon className="h-3.5 w-3.5" /> Scan receipt</>
          )}
        </Button>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="desc">Description</Label>
          <Input
            id="desc"
            className="mt-2"
            placeholder="Restaurant, supermarket…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Category</Label>
          <div className="mt-2">
            <CategoryPicker value={category} onChange={setCategory} />
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
                {m.display_name}{m.id === me?.id ? ' (you)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Items */}
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
                <Label className="text-xs text-[var(--color-muted-foreground)]">Amount</Label>
                <div className="mt-1 rounded-xl bg-[var(--color-secondary)] py-4">
                  <MoneyInput
                    value={item.amount_cents}
                    onChange={(v) => updateItem(idx, { amount_cents: v })}
                    currency={currency}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[var(--color-muted-foreground)]">Split</Label>
                <div className="mt-1">
                  <SplitEditor
                    members={members}
                    amountCents={item.amount_cents}
                    currency={currency}
                    splitType={item.split_type}
                    onSplitTypeChange={(type) => updateItem(idx, { split_type: type })}
                    splitData={item.split_data}
                    onSplitDataChange={(data) => updateItem(idx, { split_data: data })}
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
          <Button variant="ghost" onClick={() => navigate(`/groups/${id}`)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || addExpense.isPending}>
            {addExpense.isPending ? 'Saving…' : `Add receipt · ${formatMoney(totalCents, currency)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
