import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, ImageIcon, Loader2, ArrowLeft } from 'lucide-react'
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor, distributeEqual } from '@/components/shared/SplitEditor'
import { useGroup } from '@/hooks/useGroups'
import { useAddExpense } from '@/hooks/useMutations'
import { useMe } from '@/hooks/useMe'
import { CATEGORIES, formatMoney } from '@/lib/format'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

export function AddExpensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <AddExpenseSheet
      open
      onOpenChange={(o) => {
        if (!o) navigate(`/groups/${id}`)
      }}
      groupId={id}
    />
  )
}

function computeReceiptSplit(items, assignments) {
  const totals = {}
  items.forEach((item, idx) => {
    const set = assignments[idx]
    if (!set || set.size === 0) return
    const arr = [...set]
    const base = Math.floor(item.amount_cents / arr.length)
    const rem = item.amount_cents - base * arr.length
    arr.forEach((uid, i) => {
      totals[uid] = (totals[uid] || 0) + base + (i < rem ? 1 : 0)
    })
  })
  return Object.entries(totals).map(([user_id, share_cents]) => ({ user_id, share_cents }))
}

export function AddExpenseSheet({ open, onOpenChange, groupId, group: groupProp, initialDescription = '', initialAmount = 0, onAfterSubmit }) {
  const { data: groupFetched } = useGroup(groupId)
  const group = groupProp || groupFetched
  const { data: me } = useMe()
  const members = group?.members || []
  const { toast } = useToast()

  const [amount, setAmount] = useState(initialAmount)
  const [description, setDescription] = useState(initialDescription)
  const [category, setCategory] = useState('food')
  const [splitType, setSplitType] = useState('equal')
  const [split, setSplit] = useState([])

  const [scanning, setScanning] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [assignments, setAssignments] = useState([])

  const fileRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    if (open) {
      setAmount(initialAmount)
      setDescription(initialDescription)
      setCategory('food')
      setSplitType('equal')
      setSplit([])
      setReceiptData(null)
      setAssignments([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open && splitType === 'equal' && members.length && amount > 0) {
      setSplit(distributeEqual(amount, members.map((m) => m.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, splitType, amount, members.length])

  useEffect(() => {
    if (receiptData) {
      setAssignments(receiptData.items.map(() => new Set()))
    }
  }, [receiptData])

  const handleScanFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setScanning(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const { data } = await api.post(`/groups/${groupId}/receipts/scan`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
      setReceiptData(data)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not scan receipt', description: err.response?.data?.detail || err.message })
    } finally {
      setScanning(false)
    }
  }

  const toggleAssignment = (itemIdx, userId) => {
    setAssignments((prev) => {
      const next = prev.map((s) => new Set(s))
      if (next[itemIdx].has(userId)) next[itemIdx].delete(userId)
      else next[itemIdx].add(userId)
      return next
    })
  }

  const assignAll = (itemIdx) => {
    setAssignments((prev) => {
      const next = prev.map((s) => new Set(s))
      next[itemIdx] = new Set(members.map((m) => m.id))
      return next
    })
  }

  const addExpense = useAddExpense(groupId)

  const canSubmit = useMemo(() => {
    if (amount <= 0) return false
    if (!description.trim()) return false
    if (!me?.id) return false
    if (!split.length) return false
    if (splitType === 'custom') {
      const sum = split.reduce((a, s) => a + (s.share_cents || 0), 0)
      if (sum !== amount) return false
    }
    return true
  }, [amount, description, me, split, splitType])

  const receiptSplit = receiptData ? computeReceiptSplit(receiptData.items, assignments) : []
  const receiptTotal = receiptSplit.reduce((a, s) => a + s.share_cents, 0)
  const unassignedCount = assignments.filter((s) => s && s.size === 0).length
  const canSubmitReceipt = receiptSplit.length > 0 && !addExpense.isPending

  const submit = async () => {
    try {
      await addExpense.mutateAsync({
        description: description.trim(),
        category,
        amount_cents: amount,
        currency: group?.currency || 'EUR',
        paid_by: me.id,
        split_type: splitType,
        custom_split: splitType === 'equal' ? [] : split,
      })
      toast({ variant: 'success', title: 'Expense added' })
      onOpenChange?.(false)
      await onAfterSubmit?.()
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add expense', description: err.message })
    }
  }

  const submitReceipt = async () => {
    try {
      await addExpense.mutateAsync({
        description: receiptData.description || 'Receipt',
        category: 'food',
        amount_cents: receiptTotal,
        currency: receiptData.currency || 'EUR',
        paid_by: me.id,
        split_type: 'custom',
        custom_split: receiptSplit,
      })
      toast({ variant: 'success', title: 'Receipt expense added' })
      onOpenChange?.(false)
      await onAfterSubmit?.()
    } catch (err) {
      toast({ variant: 'error', title: 'Could not save expense', description: err.message })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetHeader>
        {receiptData ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setReceiptData(null)} className="p-1 rounded-md hover:bg-[var(--color-secondary)]">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <SheetTitle>Split receipt</SheetTitle>
              <SheetDescription>{receiptData.description} · {formatMoney(receiptData.amount_cents, receiptData.currency)}</SheetDescription>
            </div>
          </div>
        ) : (
          <>
            <SheetTitle>Add expense</SheetTitle>
            <SheetDescription>{group ? `Splitting in ${group.name}` : ''}</SheetDescription>
          </>
        )}
      </SheetHeader>

      {receiptData ? (
        <>
          <SheetContent className="space-y-3">
            {/* Per-person totals */}
            {receiptSplit.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-xl bg-[var(--color-secondary)] px-3 py-2.5">
                {receiptSplit.map(({ user_id, share_cents }) => {
                  const m = members.find((x) => x.id === user_id)
                  return (
                    <div key={user_id} className="flex items-center gap-1.5 text-xs">
                      <Avatar name={m?.display_name} color={m?.color} size="xs" />
                      <span className="font-semibold tabular-nums">{formatMoney(share_cents, receiptData.currency)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {unassignedCount > 0 && (
              <div className="rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-3 py-2 text-xs">
                {unassignedCount} item{unassignedCount > 1 ? 's' : ''} unassigned — won't be included
              </div>
            )}

            {receiptData.items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--color-border)] p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums text-sm text-[var(--color-muted-foreground)]">{formatMoney(item.amount_cents, receiptData.currency)}</span>
                    {assignments[idx]?.size !== members.length && (
                      <button type="button" onClick={() => assignAll(idx)} className="text-[10px] text-[var(--color-primary)] font-medium hover:underline">All</button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const assigned = assignments[idx]?.has(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignment(idx, m.id)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all',
                          assigned
                            ? 'bg-[var(--color-primary)]/15 ring-1 ring-[var(--color-primary)]'
                            : 'bg-[var(--color-secondary)] opacity-50 hover:opacity-80',
                        )}
                      >
                        <Avatar name={m.display_name} color={m.color} size="sm" />
                        <span className="text-[10px] font-medium max-w-[48px] truncate">{m.display_name?.split(' ')[0] || m.handle}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </SheetContent>

          <SheetFooter>
            <Button variant="ghost" onClick={() => setReceiptData(null)}>Back</Button>
            <Button onClick={submitReceipt} disabled={!canSubmitReceipt}>
              {addExpense.isPending ? 'Saving…' : `Add ${formatMoney(receiptTotal, receiptData.currency)}`}
            </Button>
          </SheetFooter>
        </>
      ) : (
        <>
          <SheetContent className="space-y-6">
            {/* Hidden file inputs */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleScanFile} />
            <input ref={galleryRef} type="file" accept="image/*" className="sr-only" onChange={handleScanFile} />

            {scanning ? (
              <div className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-2.5 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning receipt…
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-2.5 text-sm text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                  <Camera className="h-4 w-4" /> Camera
                </button>
                <button type="button" onClick={() => galleryRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-2.5 text-sm text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                  <ImageIcon className="h-4 w-4" /> Gallery
                </button>
              </div>
            )}

            <div className="rounded-2xl bg-[var(--color-secondary)] py-8">
              <MoneyInput value={amount} onChange={setAmount} currency={group?.currency || 'EUR'} autoFocus />
              <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">{group?.currency || 'EUR'}</div>
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" className="mt-2" placeholder="Groceries at Kaufland" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label>Category</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.id
                  return (
                    <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                      className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-all',
                        active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-foreground)]'
                               : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]')}>
                      <span>{c.emoji}</span>{c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Split between</Label>
              <div className="mt-2">
                <SplitEditor members={members} amountCents={amount} currency={group?.currency || 'EUR'}
                  splitType={splitType} onSplitTypeChange={setSplitType} split={split} onSplitChange={setSplit} />
              </div>
            </div>
          </SheetContent>

          <SheetFooter>
            <Button variant="ghost" onClick={() => onOpenChange?.(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit || addExpense.isPending}>
              {addExpense.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </SheetFooter>
        </>
      )}
    </Sheet>
  )
}
