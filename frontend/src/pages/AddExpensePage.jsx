import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor, defaultSplitData } from '@/components/shared/SplitEditor'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
import { useGroup } from '@/hooks/useGroups'
import { useAddExpense } from '@/hooks/useMutations'
import { useMe } from '@/hooks/useMe'
import { useToast } from '@/components/ui/toaster'
import { getCategory } from '@/lib/format'

function isSplitValid(splitType, splitData, amountCents) {
  if (!splitData.length) return false
  if (splitType === 'equal') return splitData.some((s) => s.value > 0)
  const sum = splitData.reduce((a, s) => a + (s.value || 0), 0)
  if (splitType === 'custom') return Math.abs(sum - amountCents) < 1
  if (splitType === 'percentage') return Math.abs(sum - 100) < 0.01
  if (splitType === 'shares') return sum > 0
  return false
}

export function AddExpensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: group } = useGroup(id)
  const { data: me } = useMe()
  const addExpense = useAddExpense(id)
  const { toast } = useToast()

  const members = group?.members || []
  const currency = group?.currency || 'EUR'

  const [description, setDescription] = useState(getCategory('food').label)
  const [category, setCategory] = useState('food')

  const handleCategoryChange = (cat) => {
    if (description === getCategory(category).label) setDescription(getCategory(cat).label)
    setCategory(cat)
  }
  const [amount, setAmount] = useState(0)
  const [paidBy, setPaidBy] = useState(me?.id || '')
  const [splitType, setSplitType] = useState('equal')
  const [splitData, setSplitData] = useState(() => defaultSplitData('equal', members, 0))

  // keep paid_by in sync when me loads
  if (me?.id && !paidBy) setPaidBy(me.id)

  // reinit splitData when members load or splitType changes externally
  const handleSplitTypeChange = (type) => {
    setSplitType(type)
    setSplitData(defaultSplitData(type, members, amount))
  }

  const canSubmit =
    !!description.trim() &&
    amount > 0 &&
    !!paidBy &&
    members.length > 0 &&
    isSplitValid(splitType, splitData, amount)

  const submit = async () => {
    try {
      await addExpense.mutateAsync({
        description: description.trim(),
        category,
        expense_type: 'regular',
        amount_cents: amount,
        paid_by: paidBy,
        split_type: splitType,
        split_data: splitData,
        items: [],
      })
      toast({ variant: 'success', title: 'Expense added' })
      navigate(`/groups/${id}`)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add expense', description: err.message })
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

      <h1 className="text-xl font-semibold tracking-tight">Add expense</h1>

      <div className="space-y-5">
        <div>
          <Label>Amount</Label>
          <div className="mt-2 rounded-2xl bg-[var(--color-secondary)] py-8">
            <MoneyInput
              value={amount}
              onChange={(v) => {
                setAmount(v)
                setSplitData(defaultSplitData(splitType, members, v))
              }}
              currency={currency}
              autoFocus
            />
            <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">{currency}</div>
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
                {m.display_name}{m.id === me?.id ? ' (you)' : ''}
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
              onSplitDataChange={setSplitData}
              payerId={paidBy}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate(`/groups/${id}`)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || addExpense.isPending}>
            {addExpense.isPending ? 'Saving…' : 'Add expense'}
          </Button>
        </div>
      </div>
    </div>
  )
}
