import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor, defaultSplitData } from '@/components/shared/SplitEditor'
import { useGroup, useGroupReceipts } from '@/hooks/useGroups'
import { usePatchReceipt, useDeleteReceipt } from '@/hooks/useMutations'
import { useMe } from '@/hooks/useMe'
import { useToast } from '@/components/ui/toaster'
import { formatMoney } from '@/lib/format'

export function EditReceiptPage() {
  const { id, receiptId } = useParams()
  const navigate = useNavigate()
  const { data: group } = useGroup(id)
  const { data: receipts = [] } = useGroupReceipts(id)
  const { data: me } = useMe()
  const patchReceipt = usePatchReceipt(id)
  const deleteReceipt = useDeleteReceipt(id)
  const { toast } = useToast()

  const receipt = receipts.find((r) => r.id === receiptId)
  const members = group?.members || []
  const currency = group?.currency || 'EUR'

  const [place, setPlace] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [defaultPayer, setDefaultPayer] = useState('')
  const [items, setItems] = useState([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!receipt || initialized) return
    setPlace(receipt.place || '')
    setLocation(receipt.location || '')
    setDate(receipt.date || '')
    setDefaultPayer(receipt.metadata?.default_payer || '')
    setItems(
      (receipt.items || []).map((item) => ({
        name: item.name || '',
        amount_cents: item.amount_cents || 0,
        splitType: item.split?.type || 'equal',
        splitData: item.split?.members || defaultSplitData('equal', members, item.amount_cents || 0),
      })),
    )
    setInitialized(true)
  }, [receipt, members, initialized])

  const totalCents = items.reduce((a, i) => a + (i.amount_cents || 0), 0)

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item
      const next = { ...item, ...patch }
      if (patch.splitType && patch.splitType !== item.splitType) {
        next.splitData = defaultSplitData(patch.splitType, members, next.amount_cents)
      }
      if (patch.amount_cents !== undefined && patch.splitType === undefined) {
        next.splitData = defaultSplitData(next.splitType, members, patch.amount_cents)
      }
      return next
    }))
  }

  const addItem = () => setItems((prev) => [...prev, { name: '', amount_cents: 0, splitType: 'equal', splitData: defaultSplitData('equal', members, 0) }])
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const canSubmit =
    items.length > 0 &&
    items.every((item) => item.name.trim() && item.amount_cents > 0 && item.splitData.length > 0)

  const submit = async () => {
    try {
      await patchReceipt.mutateAsync({
        receiptId,
        place: place.trim(),
        location: location.trim(),
        date: date || null,
        metadata: {
          members: members.map((m) => m.id),
          default_payer: defaultPayer || null,
          total_cents: totalCents,
        },
        items: items.map((item) => ({
          name: item.name.trim(),
          amount_cents: item.amount_cents,
          split: { type: item.splitType, members: item.splitData },
        })),
      })
      toast({ variant: 'success', title: 'Receipt updated' })
      navigate(`/groups/${id}`)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not update receipt', description: err.message })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteReceipt.mutateAsync(receiptId)
      toast({ variant: 'success', title: 'Receipt deleted' })
      navigate(`/groups/${id}`)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete receipt', description: err.message })
    }
  }

  if (!receipt && receipts.length > 0) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <button type="button" onClick={() => navigate(`/groups/${id}`)} className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-sm text-[var(--color-muted-foreground)]">Receipt not found.</p>
      </div>
    )
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
        <h1 className="text-xl font-semibold tracking-tight">Edit receipt</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteReceipt.isPending}>
          {deleteReceipt.isPending ? 'Deleting…' : 'Delete'}
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
                {m.display_name}{m.id === me?.id ? ' (you)' : ''}
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
                    splitType={item.splitType}
                    onSplitTypeChange={(type) => updateItem(idx, { splitType: type })}
                    splitData={item.splitData}
                    onSplitDataChange={(data) => updateItem(idx, { splitData: data })}
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
          <Button onClick={submit} disabled={!canSubmit || patchReceipt.isPending}>
            {patchReceipt.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
