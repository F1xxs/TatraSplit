import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarStack } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toaster'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor, defaultSplitData } from '@/components/shared/SplitEditor'
import { ExpenseRow } from '@/components/shared/ExpenseRow'
import { BalancePill } from '@/components/shared/BalancePill'
import { CategoryDonut, CategoryLegend } from '@/components/shared/CategoryDonut'
import { ActivityItem } from '@/components/shared/ActivityItem'
import { DataState } from '@/components/shared/DataState'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
import { useMe } from '@/hooks/useMe'
import {
  useDeleteGroup,
  useAddGroupMember,
  useRemoveGroupMember,
  usePatchExpense,
  useDeleteExpense,
  useSettle,
  usePatchSettlement,
  useDeleteSettlement,
} from '@/hooks/useMutations'
import {
  useGroup,
  useGroupExpenses,
  useGroupBalances,
  useGroupActivity,
  useGroupSettlements,
} from '@/hooks/useGroups'
import { useContacts } from '@/hooks/useContacts'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: group, isLoading } = useGroup(id)
  const { data: expenses = [], isLoading: expLoading, error: expError, refetch: refetchExp } = useGroupExpenses(id)
  const { data: balances } = useGroupBalances(id)
  const { data: activity = [], isLoading: actLoading, error: actError, refetch: refetchAct } = useGroupActivity(id)
  const { data: settlements = [], isLoading: setLoading, error: setError, refetch: refetchSet } = useGroupSettlements(id)
  const { data: me } = useMe()
  const { data: contacts = [] } = useContacts()
  const deleteGroup = useDeleteGroup(id)
  const { toast } = useToast()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [settleOpen, setSettleOpen] = useState(false)
  const [editSettlement, setEditSettlement] = useState(null)

  const members = group?.members || []
  const isCreator = group?.created_by === me?.id
  const currency = group?.currency || 'EUR'
  const myNet = balances?.members?.find((m) => m.user_id === me?.id)?.net_cents ?? 0

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup.mutateAsync()
      toast({ variant: 'success', title: 'Group deleted' })
      navigate('/groups')
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete group', description: err.message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
            aria-label="Members"
          >
            <Users className="h-4 w-4" />
          </button>
          {isCreator && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label="Delete group"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Group header card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-5">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--color-secondary)] flex items-center justify-center text-2xl">
                <span role="img" aria-hidden>{group?.emoji || '👥'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold tracking-tight truncate">{group?.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <AvatarStack users={members} size="xs" max={5} />
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {members.length} member{members.length === 1 ? '' : 's'} · {currency}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wide">Your balance</div>
              <BalancePill cents={myNet} currency={currency} size="lg" />
            </div>
          </>
        )}
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="w-full rounded-none border-b border-[var(--color-border)] bg-transparent p-0 h-auto">
          {['expenses', 'balances', 'settlements', 'activity'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 rounded-none border-b-2 border-transparent pb-3 pt-1 text-sm font-medium capitalize text-[var(--color-muted-foreground)] data-[state=active]:border-[var(--color-primary)] data-[state=active]:text-[var(--color-foreground)] data-[state=active]:shadow-none bg-transparent"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* EXPENSES */}
        <TabsContent value="expenses" className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Link
              to={`/groups/${id}/expenses/new`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 text-sm font-medium hover:bg-[var(--color-card-elevated)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add expense
            </Link>
            <Link
              to={`/groups/${id}/expenses/new-receipt`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 text-sm font-medium hover:bg-[var(--color-card-elevated)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add receipt
            </Link>
          </div>

          <DataState
            loading={expLoading}
            error={expError}
            empty={expenses.length === 0}
            emptyMessage="No expenses yet."
            onRetry={refetchExp}
          >
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              {groupExpensesByDate(expenses).map(({ date, items }) => (
                <div key={date}>
                  <div className="px-4 py-2 text-[11px] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)] bg-[var(--color-card-elevated)]">
                    {date}
                  </div>
                  {items.map((e, i) => (
                    <div key={e.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                      <ExpenseRow
                        expense={e}
                        me={me}
                        members={members}
                        onClick={() => setEditExpense(e)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </DataState>
        </TabsContent>

        {/* BALANCES */}
        <TabsContent value="balances" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold">Who owes what</div>
            {(balances?.members || []).length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No balances yet.</div>
            ) : (
              <div>
                {(balances.members).map((m, i) => (
                  <div key={m.user_id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <MemberBalanceRow member={m} currency={currency} isMe={m.user_id === me?.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {(balances?.simplified_transfers || []).length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold">Suggested settlements</div>
              {balances.simplified_transfers.map((t, i) => (
                <div key={i} className={cn('flex items-center gap-3 px-4 py-3 text-sm', i > 0 && 'border-t border-[var(--color-border)]')}>
                  <span className="font-medium">{t.from_name}</span>
                  <span className="text-[var(--color-muted-foreground)]">→</span>
                  <span className="font-medium">{t.to_name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{formatMoney(t.amount_cents, currency)}</span>
                </div>
              ))}
            </div>
          )}

          {expenses.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="text-sm font-semibold mb-3">Spending by category</div>
              <CategoryDonut data={aggregateByCategory(expenses)} currency={currency} />
              <CategoryLegend data={aggregateByCategory(expenses)} currency={currency} />
            </div>
          )}
        </TabsContent>

        {/* SETTLEMENTS */}
        <TabsContent value="settlements" className="mt-4 space-y-3">
          <Button size="sm" onClick={() => setSettleOpen(true)} className="w-full">
            <Plus className="h-4 w-4" />
            Record payment
          </Button>

          <DataState
            loading={setLoading}
            error={setError}
            empty={settlements.length === 0}
            emptyMessage="No payments recorded yet."
            onRetry={refetchSet}
          >
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              {settlements.map((s, i) => {
                const from = members.find((m) => m.id === s.from_user) || { display_name: s.from_user }
                const to = members.find((m) => m.id === s.to_user) || { display_name: s.to_user }
                return (
                  <div key={s.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {from.display_name} → {to.display_name}
                        </div>
                        {s.note && (
                          <div className="text-xs text-[var(--color-muted-foreground)] truncate">{s.note}</div>
                        )}
                        <div className="text-xs text-[var(--color-muted-foreground)]">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold tabular-nums">{formatMoney(s.amount_cents, currency)}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditSettlement(s)}
                          className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                          aria-label="Edit"
                        >
                          ✎
                        </button>
                        <DeleteSettlementButton groupId={id} settlementId={s.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </DataState>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            <DataState
              loading={actLoading}
              error={actError}
              empty={activity.length === 0}
              emptyMessage="No activity yet."
              onRetry={refetchAct}
            >
              <div>
                {activity.map((a, i) => (
                  <div key={a.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <ActivityItem item={a} className="px-4" />
                  </div>
                ))}
              </div>
            </DataState>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete group dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{group?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              All expenses, settlements, and activity will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteGroup} disabled={deleteGroup.isPending}>
              {deleteGroup.isPending ? 'Deleting…' : 'Delete group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members sheet */}
      <MembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        group={group}
        members={members}
        me={me}
        contacts={contacts}
        balances={balances}
        groupId={id}
      />

      {/* Expense edit sheet */}
      {editExpense && (
        <ExpenseEditSheet
          open={!!editExpense}
          onOpenChange={(o) => { if (!o) setEditExpense(null) }}
          expense={editExpense}
          members={members}
          groupId={id}
          currency={currency}
        />
      )}

      {/* Record settlement dialog */}
      <SettlementDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        initial={null}
        members={members}
        groupId={id}
        currency={currency}
        me={me}
      />

      {/* Edit settlement dialog */}
      {editSettlement && (
        <SettlementDialog
          open={!!editSettlement}
          onOpenChange={(o) => { if (!o) setEditSettlement(null) }}
          initial={editSettlement}
          members={members}
          groupId={id}
          currency={currency}
          me={me}
        />
      )}
    </div>
  )
}

function MemberBalanceRow({ member, currency, isMe }) {
  const net = member.net_cents ?? 0
  const zero = Math.abs(net) < 1
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Avatar name={member.display_name} color={member.color} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">
          {member.display_name}{isMe && <span className="text-[var(--color-muted-foreground)] text-xs font-normal"> (you)</span>}
        </div>
        <div className="text-xs text-[var(--color-muted-foreground)]">
          {zero ? 'All settled' : net > 0 ? `Owed ${formatMoney(Math.abs(net), currency)}` : `Owes ${formatMoney(Math.abs(net), currency)}`}
        </div>
      </div>
      <BalancePill cents={net} currency={currency} />
    </div>
  )
}

function DeleteSettlementButton({ groupId, settlementId }) {
  const deleteSettlement = useDeleteSettlement(groupId)
  const { toast } = useToast()
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await deleteSettlement.mutateAsync(settlementId)
          toast({ variant: 'success', title: 'Payment deleted' })
        } catch (err) {
          toast({ variant: 'error', title: 'Could not delete', description: err.message })
        }
      }}
      disabled={deleteSettlement.isPending}
      className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
      aria-label="Delete"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}

function SettlementDialog({ open, onOpenChange, initial, members, groupId, currency, me }) {
  const isEdit = !!initial
  const settle = useSettle(groupId)
  const patchSettlement = usePatchSettlement(groupId)
  const { toast } = useToast()

  const [fromUser, setFromUser] = useState(initial?.from_user || me?.id || '')
  const [toUser, setToUser] = useState(initial?.to_user || '')
  const [amount, setAmount] = useState(initial?.amount_cents || 0)
  const [note, setNote] = useState(initial?.note || '')

  const submit = async () => {
    try {
      if (isEdit) {
        await patchSettlement.mutateAsync({ settlementId: initial.id, amount_cents: amount, note })
        toast({ variant: 'success', title: 'Payment updated' })
      } else {
        await settle.mutateAsync({ from_user: fromUser, to_user: toUser, amount_cents: amount, currency, note })
        toast({ variant: 'success', title: 'Payment recorded' })
      }
      onOpenChange(false)
    } catch (err) {
      toast({ variant: 'error', title: isEdit ? 'Could not update' : 'Could not record payment', description: err.message })
    }
  }

  const isPending = isEdit ? patchSettlement.isPending : settle.isPending
  const canSubmit = amount > 0 && (isEdit || (fromUser && toUser && fromUser !== toUser))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit payment' : 'Record payment'}</DialogTitle>
          <DialogDescription>Manual member-to-member payment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!isEdit && (
            <>
              <div>
                <Label htmlFor="from">From</Label>
                <select
                  id="from"
                  value={fromUser}
                  onChange={(e) => setFromUser(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.display_name}{m.id === me?.id ? ' (you)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <select
                  id="to"
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Select member</option>
                  {members.filter((m) => m.id !== fromUser).map((m) => (
                    <option key={m.id} value={m.id}>{m.display_name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <Label>Amount</Label>
            <div className="mt-2 rounded-2xl bg-[var(--color-secondary)] py-6">
              <MoneyInput value={amount} onChange={setAmount} currency={currency} />
            </div>
          </div>
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" className="mt-2" placeholder="e.g. Cash payment" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || isPending}>
            {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseEditSheet({ open, onOpenChange, expense, members, groupId, currency }) {
  const patchExpense = usePatchExpense(groupId)
  const deleteExpense = useDeleteExpense(groupId)
  const { toast } = useToast()
  const { data: me } = useMe()

  const [description, setDescription] = useState(expense.description || '')
  const [category, setCategory] = useState(expense.category || 'other')
  const [amount, setAmount] = useState(expense.amount_cents || 0)
  const [paidBy, setPaidBy] = useState(expense.paid_by || '')
  const [splitType, setSplitType] = useState(expense.split_type || 'equal')
  const [splitData, setSplitData] = useState(
    (expense.split || []).length > 0
      ? expense.split.map((s) => ({ user_id: s.user_id, value: s.share_cents }))
      : defaultSplitData('equal', members, expense.amount_cents || 0)
  )
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const save = async () => {
    try {
      await patchExpense.mutateAsync({
        expenseId: expense.id,
        description,
        category,
        amount_cents: amount,
        paid_by: paidBy,
        split_type: splitType,
        split_data: splitData,
      })
      toast({ variant: 'success', title: 'Expense updated' })
      onOpenChange(false)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not update expense', description: err.message })
    }
  }

  const del = async () => {
    try {
      await deleteExpense.mutateAsync(expense.id)
      toast({ variant: 'success', title: 'Expense deleted' })
      onOpenChange(false)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete expense', description: err.message })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit expense</SheetTitle>
          <SheetDescription>
            {expense.expense_type === 'receipt' ? 'Receipt expense' : 'Regular expense'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 py-4">
          <div>
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Amount</Label>
            <div className="mt-2 rounded-2xl bg-[var(--color-secondary)] py-6">
              <MoneyInput value={amount} onChange={setAmount} currency={currency} />
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
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.display_name}{m.id === me?.id ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Category</Label>
            <div className="mt-2">
              <CategoryPicker value={category} onChange={setCategory} />
            </div>
          </div>

          {expense.expense_type !== 'receipt' && (
            <div>
              <Label>Split</Label>
              <div className="mt-2">
                <SplitEditor
                  members={members}
                  amountCents={amount}
                  currency={currency}
                  splitType={splitType}
                  onSplitTypeChange={setSplitType}
                  splitData={splitData}
                  onSplitDataChange={setSplitData}
                  payerId={paidBy}
                />
              </div>
            </div>
          )}
        </div>
        <SheetFooter className="flex-col gap-2">
          <Button onClick={save} disabled={patchExpense.isPending} className="w-full">
            {patchExpense.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {!deleteConfirm ? (
            <Button variant="outline" onClick={() => setDeleteConfirm(true)} className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10">
              Delete expense
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirm(false)} className="flex-1">Cancel</Button>
              <Button onClick={del} disabled={deleteExpense.isPending} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                {deleteExpense.isPending ? 'Deleting…' : 'Confirm delete'}
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function MembersSheet({ open, onOpenChange, group, members, me, contacts, balances, groupId }) {
  const addMember = useAddGroupMember(groupId)
  const removeMember = useRemoveGroupMember(groupId)
  const { toast } = useToast()
  const [busyId, setBusyId] = useState(null)

  const groupMemberIds = new Set(members.map((m) => m.id))
  const contactsNotInGroup = contacts
    .map((c) => c.user)
    .filter((u) => u && !groupMemberIds.has(u.id))

  const addUser = async (userId) => {
    setBusyId(userId)
    try {
      await addMember.mutateAsync(userId)
      toast({ variant: 'success', title: 'Member added' })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add member', description: err.message })
    } finally {
      setBusyId(null)
    }
  }

  const removeUser = async (userId) => {
    setBusyId(userId)
    try {
      await removeMember.mutateAsync(userId)
      toast({ variant: 'success', title: 'Member removed' })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not remove member', description: err.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Members · {members.length}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Current members */}
          <div className="space-y-1">
            {members.map((m) => {
              const isMe = m.id === me?.id
              const net = balances?.members?.find((b) => b.user_id === m.id)?.net_cents ?? null
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5">
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {m.display_name}{isMe && <span className="text-xs text-[var(--color-muted-foreground)] font-normal"> (you)</span>}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">{m.handle}</div>
                  </div>
                  {net !== null && <BalancePill cents={net} currency={group?.currency || 'EUR'} />}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => removeUser(m.id)}
                      disabled={busyId === m.id}
                      className="shrink-0 p-1 rounded text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add from contacts */}
          {contactsNotInGroup.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">Add from contacts</div>
              <div className="space-y-1">
                {contactsNotInGroup.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5">
                    <Avatar name={u.display_name} color={u.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{u.display_name}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">{u.handle}</div>
                    </div>
                    <Button size="sm" onClick={() => addUser(u.id)} disabled={busyId === u.id}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function groupExpensesByDate(expenses) {
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const byDate = new Map()
  for (const e of expenses) {
    const d = e.created_at ? new Date(e.created_at) : new Date()
    const key = fmt.format(d)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(e)
  }
  return Array.from(byDate.entries()).map(([date, items]) => ({ date, items }))
}

function aggregateByCategory(expenses) {
  const map = new Map()
  for (const e of expenses) {
    const c = e.category || 'other'
    map.set(c, (map.get(c) || 0) + (e.amount_cents || 0))
  }
  return Array.from(map.entries()).map(([category, spent_cents]) => ({ category, spent_cents }))
}
