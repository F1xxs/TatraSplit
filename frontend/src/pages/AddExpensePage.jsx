import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor, distributeEqual } from '@/components/shared/SplitEditor'
import { useGroup } from '@/hooks/useGroups'
import { useAddExpense } from '@/hooks/useMutations'
import { useMe } from '@/hooks/useMe'
import { CATEGORIES } from '@/lib/format'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

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

export function AddExpenseSheet({ open, onOpenChange, groupId, group: groupProp }) {
  const { data: groupFetched } = useGroup(groupId)
  const group = groupProp || groupFetched
  const { data: me } = useMe()
  const members = group?.members || []
  const { toast } = useToast()

  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('food')
  const [splitType, setSplitType] = useState('equal')
  const [split, setSplit] = useState([])

  useEffect(() => {
    if (!open) {
      setAmount(0)
      setDescription('')
      setCategory('food')
      setSplitType('equal')
      setSplit([])
    }
  }, [open])

  useEffect(() => {
    if (open && splitType === 'equal' && members.length && amount > 0) {
      setSplit(distributeEqual(amount, members.map((m) => m.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, splitType, amount, members.length])

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
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add expense', description: err.message })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetHeader>
        <SheetTitle>Add expense</SheetTitle>
        <SheetDescription>
          {group ? `Splitting in ${group.name}` : ''}
        </SheetDescription>
      </SheetHeader>

      <SheetContent className="space-y-6">
        {/* Amount */}
        <div className="rounded-2xl bg-[var(--color-secondary)] py-8">
          <MoneyInput
            value={amount}
            onChange={setAmount}
            currency={group?.currency || 'EUR'}
            autoFocus
          />
          <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">
            {group?.currency || 'EUR'}
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="desc">Description</Label>
          <Input
            id="desc"
            className="mt-2"
            placeholder="Groceries at Kaufland"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-all',
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-foreground)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  )}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Split */}
        <div>
          <Label>Split between</Label>
          <div className="mt-2">
            <SplitEditor
              members={members}
              amountCents={amount}
              currency={group?.currency || 'EUR'}
              splitType={splitType}
              onSplitTypeChange={setSplitType}
              split={split}
              onSplitChange={setSplit}
            />
          </div>
        </div>
      </SheetContent>

      <SheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange?.(false)}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!canSubmit || addExpense.isPending}>
          {addExpense.isPending ? 'Saving…' : 'Confirm'}
        </Button>
      </SheetFooter>
    </Sheet>
  )
}
