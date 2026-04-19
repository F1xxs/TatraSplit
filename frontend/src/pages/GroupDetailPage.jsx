import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, Coins, Users, ChevronRight, AlertTriangle, RefreshCw, Trash2, CreditCard, Check, Pencil, Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarStack } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toaster'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor } from '@/components/shared/SplitEditor'
import { ExpenseRow } from '@/components/shared/ExpenseRow'
import { BalancePill } from '@/components/shared/BalancePill'
import { CategoryDonut, CategoryLegend } from '@/components/shared/CategoryDonut'
import { ActivityItem } from '@/components/shared/ActivityItem'
import { DataState } from '@/components/shared/DataState'
import { QRInviteDialog } from '@/components/shared/QRInviteDialog'
import { AddExpenseSheet } from './AddExpensePage'
import { useMe } from '@/hooks/useMe'
import { useDeleteGroup, useAddGroupMember } from '@/hooks/useMutations'
import { useJar, useContributeJar, useWithdrawJar, useCloseJar } from '@/hooks/useJar'
import {
  useGroup,
  useGroupExpenses,
  useGroupBalances,
  useGroupActivity,
} from '@/hooks/useGroups'
import {
  useGroupRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '@/hooks/useRecurring'
import { useAddContact, useContacts, useUserSearch } from '@/hooks/useContacts'
import { formatMoney, CATEGORIES } from '@/lib/format'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { distributeEqualSplit, getCustomSplitBudgetStatus, isSplitReady, resolveSplitPayload } from '@/lib/split'

export function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: group, isLoading } = useGroup(id)
  const { data: expenses = [], isLoading: expLoading, error: expError, refetch: refetchExp } = useGroupExpenses(id)
  const { data: balances } = useGroupBalances(id)
  const { data: activity = [], isLoading: actLoading, error: actError, refetch: refetchAct } = useGroupActivity(id)
  const { data: me } = useMe()
  const deleteGroup = useDeleteGroup(id)
  const addGroupMember = useAddGroupMember(id)
  const { data: contacts = [] } = useContacts()
  const addContact = useAddContact()
  const { toast } = useToast()

  const { data: recurring = [], isLoading: recLoading } = useGroupRecurring(id)
  const createRecurring = useCreateRecurring(id)
  const updateRecurring = useUpdateRecurring(id)
  const deleteRecurring = useDeleteRecurring(id)

  const jar = useJar(group?.jar_mode ? id : null)
  const contributeJar = useContributeJar(id)
  const withdrawJar = useWithdrawJar(id)
  const closeJar = useCloseJar(id)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [addRecurringOpen, setAddRecurringOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberBusyId, setMemberBusyId] = useState(null)
  const [jarContributeOpen, setJarContributeOpen] = useState(false)
  const [jarContributeAmount, setJarContributeAmount] = useState(0)
  const [jarWithdrawOpen, setJarWithdrawOpen] = useState(false)
  const [jarWithdrawAmount, setJarWithdrawAmount] = useState(0)
  const [jarWithdrawNote, setJarWithdrawNote] = useState('')
  const [jarCloseConfirm, setJarCloseConfirm] = useState(false)

  const { data: memberSearchResults = [], isLoading: membersSearching } = useUserSearch(memberSearch)

  const openInvite = async () => {
    try {
      const res = await api.get(`/groups/${id}/invite`)
      setInvite(res.data)
    } catch {
      setInvite({ invite_token: group?.invite_token })
    }
    setInviteOpen(true)
  }

  const members = group?.members || []
  const myNet =
    balances?.members?.find((m) => m.user_id === me?.id)?.net_cents ?? 0
  const isCreator = group?.created_by === me?.id
  const unsettledCents = (balances?.simplified_transfers || [])
    .reduce((sum, t) => sum + (t.amount_cents || 0), 0)
  const hasUnsettledBalances = unsettledCents > 0
  const moneyboxBalanceCents = group?.jar_mode ? (jar.data?.pot_balance_cents ?? 0) : 0
  const canDeleteMoneybox = !group?.jar_mode || moneyboxBalanceCents === 0

  const categoryData = aggregateByCategory(expenses)
  const groupMemberIds = new Set(members.map((m) => m.id))
  const pendingInviteUserIds = new Set((group?.pending_invites || []).map((inv) => inv.invited_user_id))
  const contactsNotInGroup = contacts
    .filter((c) => c.user && !groupMemberIds.has(c.contact_user_id) && !pendingInviteUserIds.has(c.contact_user_id))
    .map((c) => c.user)
  const contactIdSet = new Set(contacts.map((c) => c.contact_user_id))

  const openDeleteDialog = () => {
    if (group?.jar_mode && !canDeleteMoneybox) return
    setDeleteError('')
    setDeleteOpen(true)
  }

  const handleDeleteGroup = async () => {
    if (group?.jar_mode && !canDeleteMoneybox) return
    setDeleteError('')
    try {
      await deleteGroup.mutateAsync()
      toast({ variant: 'success', title: group?.jar_mode ? 'Moneybox deleted' : 'Group deleted' })
      setDeleteOpen(false)
      navigate('/groups')
    } catch (err) {
      const message = err?.message || 'Could not delete group.'
      setDeleteError(message)
      toast({
        variant: 'error',
        title: 'Could not delete group',
        description: message,
      })
    }
  }

  const addUserToGroup = async (user) => {
    setMemberBusyId(user.id)
    try {
      const res = await addGroupMember.mutateAsync(user.id)
      if (res?.already_member) {
        toast({ title: `${user.display_name} is already in this group` })
      } else if (res?.already_pending) {
        toast({ title: `Invitation already sent to ${user.display_name}` })
      } else {
        toast({ variant: 'success', title: `Invitation sent to ${user.display_name}` })
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Could not send invite', description: err.message })
    } finally {
      setMemberBusyId(null)
    }
  }

  const addUserToContactsAndGroup = async (user) => {
    setMemberBusyId(user.id)
    try {
      if (!contactIdSet.has(user.id)) {
        await addContact.mutateAsync({ user_id: user.id })
      }
      const res = await addGroupMember.mutateAsync(user.id)
      if (res?.already_pending) {
        toast({ title: `Contact added, invitation already pending` })
      } else {
        toast({ variant: 'success', title: `${user.display_name} added to contacts and invited` })
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Could not send invite', description: err.message })
    } finally {
      setMemberBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/groups"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Groups
        </Link>
        {isCreator && (
          <button
            type="button"
            onClick={openDeleteDialog}
            disabled={deleteGroup.isPending || !canDeleteMoneybox}
            aria-label="Delete group"
            className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Account-detail style header card */}
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
                    {members.length} member{members.length === 1 ? '' : 's'} · {group?.currency || 'EUR'}
                  </span>
                </div>
              </div>
            </div>

            {!group?.jar_mode && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wide">Your balance</div>
                <BalancePill cents={myNet} currency={group?.currency || 'EUR'} size="lg" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick actions row */}
      {group?.jar_mode ? (
        <div className="grid grid-cols-3 gap-2">
          <GroupAction icon={Share2} label="Invite" onClick={openInvite} />
          <GroupAction icon={Coins} label="Contribute" onClick={() => { setJarContributeAmount(0); setJarContributeOpen(true) }} primary />
          <GroupAction icon={Users} label="Members" onClick={() => setMembersOpen(true)} />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          <GroupAction icon={Plus} label="Add expense" onClick={() => setAddOpen(true)} primary />
          <GroupAction icon={CreditCard} label="Payment" href={`/payment?mode=split&groupId=${id}`} />
          <GroupAction icon={Coins} label="Settle up" href={`/groups/${id}/settle`} />
          <GroupAction icon={Share2} label="Invite" onClick={openInvite} />
          <GroupAction icon={Users} label="Members" onClick={() => setMembersOpen(true)} />
        </div>
      )}


      {/* Tabs — Moneybox groups skip the tab chrome and render moneybox content directly */}
      {group?.jar_mode ? (
        <JarSection
          jar={jar}
          me={me}
          isCreator={isCreator}
          currency={group?.currency || 'EUR'}
          onWithdraw={() => { setJarWithdrawAmount(0); setJarWithdrawNote(''); setJarWithdrawOpen(true) }}
          onDissolve={() => setJarCloseConfirm(true)}
        />
      ) : null}

      {!group?.jar_mode && <Tabs defaultValue="expenses">
        <TabsList className="w-full rounded-none border-b border-[var(--color-border)] bg-transparent p-0 h-auto">
          {['expenses', 'balances', 'activity', 'recurring'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 rounded-none border-b-2 border-transparent pb-3 pt-1 text-sm font-medium capitalize text-[var(--color-muted-foreground)] data-[state=active]:border-[var(--color-primary)] data-[state=active]:text-[var(--color-foreground)] data-[state=active]:shadow-none bg-transparent"
            >
              {tab === 'expenses' ? 'Expenses' : tab === 'balances' ? 'Balances' : tab === 'activity' ? 'Activity' : 'Recurring'}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          <DataState
            loading={expLoading}
            error={expError}
            empty={expenses.length === 0}
            emptyContent={<EmptyExpenses onAdd={() => setAddOpen(true)} />}
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
                        groupId={id}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </DataState>
        </TabsContent>

        <TabsContent value="balances" className="mt-4 space-y-4">
          {/* Member balances */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="text-sm font-semibold">Who owes what</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Net balances in this group</div>
            </div>
            {(balances?.members || []).length === 0 ? (
              <div className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">
                No balances yet.
              </div>
            ) : (
              <div>
                {(balances?.members || []).map((m, i) => (
                  <div key={m.user_id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <MemberBalanceRow
                      member={m}
                      currency={group?.currency || 'EUR'}
                      isMe={m.user_id === me?.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category donut */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="text-sm font-semibold mb-1">Spending by category</div>
            <div className="text-xs text-[var(--color-muted-foreground)] mb-3">All expenses in this group</div>
            <CategoryDonut data={categoryData} currency={group?.currency || 'EUR'} />
            <CategoryLegend data={categoryData} currency={group?.currency || 'EUR'} />
          </div>

          {/* Settle-up shortcut */}
          {balances?.simplified_transfers?.length > 0 && (
            <Link
              to={`/groups/${id}/settle`}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3.5 hover:bg-[var(--color-card-elevated)] transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-lg">
                ⚡
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Settle up</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  {balances.simplified_transfers.length} transfer{balances.simplified_transfers.length === 1 ? '' : 's'} resolves everything
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            </Link>
          )}
        </TabsContent>

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

        <TabsContent value="recurring" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Recurring expenses</span>
            <Button size="sm" onClick={() => setAddRecurringOpen(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {recLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-[var(--color-card-elevated)] animate-pulse" />)}
            </div>
          ) : recurring.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center text-2xl">🔁</div>
              <div className="mt-3 font-semibold text-sm">No recurring expenses</div>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Add rent, utilities, or subscriptions.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              {recurring.map((r, i) => {
                const currency = r.currency || group?.currency || 'EUR'
                const myShare = r.custom_split?.find(s => s.user_id === me?.id)?.share_cents
                const payer = members.find(m => m.id === r.paid_by)
                const isPayer = r.paid_by === me?.id
                return (
                  <div key={r.id} className={cn('px-4 py-3.5', i > 0 && 'border-t border-[var(--color-border)]')}>
                    <div className="flex items-start gap-3">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{r.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[11px] font-medium">
                            {FREQ_LABEL[r.frequency] || r.frequency}
                          </span>
                          <span className="text-[11px] text-[var(--color-muted-foreground)]">
                            next {new Date(r.next_due).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        {payer && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div
                              className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: payer.color || '#0070D2' }}
                            >
                              {payer.display_name?.[0]}
                            </div>
                            <span className="text-[11px] text-[var(--color-muted-foreground)]">
                              Paid by <span className="font-medium text-[var(--color-foreground)]">{payer.display_name}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Amounts + actions */}
                      <div className="shrink-0 text-right flex flex-col items-end gap-1">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatMoney(r.amount_cents, currency)}
                        </div>
                        {myShare != null && (
                          <div className="text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
                            Your share: <span className="font-medium text-[var(--color-foreground)]">{formatMoney(myShare, currency)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {isPayer && (
                            <button
                              onClick={() => setEditingRecurring(r)}
                              className="text-[var(--color-primary)] hover:opacity-70 transition-opacity"
                              aria-label="Edit recurring expense"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {(isPayer || r.created_by === me?.id) && (
                            <button
                              onClick={() => deleteRecurring.mutate(r.id)}
                              className="text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors"
                              aria-label="Delete recurring expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

      </Tabs>}

      {/* Jar: contribute sheet */}
      <Sheet open={jarContributeOpen} onOpenChange={setJarContributeOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader className="mb-4">
            <SheetTitle>Add to pot</SheetTitle>
            <SheetDescription>Your contribution to the shared fund.</SheetDescription>
          </SheetHeader>
          <div className="rounded-2xl bg-[var(--color-secondary)] py-8 mb-6">
            <MoneyInput value={jarContributeAmount} onChange={setJarContributeAmount} currency={group?.currency || 'EUR'} autoFocus />
            <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">{group?.currency || 'EUR'}</div>
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setJarContributeOpen(false)}>Cancel</Button>
            <Button
              disabled={jarContributeAmount <= 0 || contributeJar.isPending}
              onClick={async () => {
                try {
                  await contributeJar.mutateAsync(jarContributeAmount)
                  toast({ variant: 'success', title: 'Contribution added to pot' })
                  setJarContributeOpen(false)
                } catch (err) {
                  toast({ variant: 'error', title: 'Could not contribute', description: err.message })
                }
              }}
            >
              {contributeJar.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Jar: withdraw sheet (admin only) */}
      <Sheet open={jarWithdrawOpen} onOpenChange={setJarWithdrawOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader className="mb-4">
            <SheetTitle>Withdraw from pot</SheetTitle>
            <SheetDescription>
              Take money from the shared fund.
              {jar.data && ` Available: ${formatMoney(jar.data.pot_balance_cents, jar.data.currency)}`}
            </SheetDescription>
          </SheetHeader>
          <div className="rounded-2xl bg-[var(--color-secondary)] py-8 mb-4">
            <MoneyInput value={jarWithdrawAmount} onChange={setJarWithdrawAmount} currency={group?.currency || 'EUR'} autoFocus />
            <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">{group?.currency || 'EUR'}</div>
          </div>
          <div className="mb-4">
            <Label htmlFor="withdraw-note">Note (optional)</Label>
            <Input
              id="withdraw-note"
              className="mt-2"
              placeholder="e.g. Bought snacks"
              value={jarWithdrawNote}
              onChange={(e) => setJarWithdrawNote(e.target.value)}
            />
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setJarWithdrawOpen(false)}>Cancel</Button>
            <Button
              disabled={jarWithdrawAmount <= 0 || withdrawJar.isPending}
              onClick={async () => {
                try {
                  await withdrawJar.mutateAsync({ amount_cents: jarWithdrawAmount, note: jarWithdrawNote })
                  toast({ variant: 'success', title: 'Withdrawal recorded' })
                  setJarWithdrawOpen(false)
                } catch (err) {
                  toast({ variant: 'error', title: 'Could not withdraw', description: err.message })
                }
              }}
            >
              {withdrawJar.isPending ? 'Saving…' : 'Withdraw'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Moneybox: dissolve confirm dialog */}
      <Dialog open={jarCloseConfirm} onOpenChange={setJarCloseConfirm}>
        <DialogContent onClose={() => setJarCloseConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Dissolve the Moneybox?</DialogTitle>
            <DialogDescription>
              {jar.data?.pot_balance_cents > 0
                ? `${formatMoney(jar.data.pot_balance_cents, jar.data?.currency)} will be returned to contributors proportionally. Nobody owes anybody anything after this.`
                : 'Pot is empty. The Moneybox will be marked as dissolved.'}
            </DialogDescription>
          </DialogHeader>
          {jar.data?.pot_balance_cents > 0 && (
            <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-3">
              {(jar.data.members || []).filter(m => m.refund_cents > 0).map(m => (
                <div key={m.user_id} className="flex items-center justify-between text-sm">
                  <span>{m.display_name}{m.user_id === me?.id && ' (you)'}</span>
                  <span className="font-semibold text-green-500">{formatMoney(m.refund_cents, jar.data.currency)}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJarCloseConfirm(false)}>Cancel</Button>
            <Button
              disabled={closeJar.isPending}
              onClick={async () => {
                try {
                  await closeJar.mutateAsync()
                  toast({ variant: 'success', title: 'Moneybox dissolved' })
                  setJarCloseConfirm(false)
                } catch (err) {
                  toast({ variant: 'error', title: 'Could not dissolve Moneybox', description: err.message })
                }
              }}
            >
              {closeJar.isPending ? 'Dissolving…' : 'Dissolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        group={group}
        invite={invite}
      />

      <AddExpenseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        groupId={id}
        group={group}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeleteError('')
        }}
      >
        <DialogContent onClose={() => setDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>{group?.jar_mode ? `Delete Moneybox “${group?.name || 'this Moneybox'}”?` : `Delete group “${group?.name || 'this group'}”?`}</DialogTitle>
            <DialogDescription>
              {group?.jar_mode
                ? 'This action cannot be undone. The Moneybox and all its activity will be permanently removed.'
                : 'This action cannot be undone. All group expenses, settlements, and activity will be permanently removed.'}
            </DialogDescription>
          </DialogHeader>

          {!group?.jar_mode && hasUnsettledBalances && (
            <div className="rounded-xl border border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/10 p-3">
              <div className="flex items-start gap-2 text-sm text-[var(--color-destructive)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  There are unsettled balances totaling{' '}
                  <strong>{formatMoney(unsettledCents, group?.currency || 'EUR')}</strong>. Settle up first before deleting.
                </p>
              </div>
            </div>
          )}

          {deleteError && (
            <div className="rounded-xl border border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isPending || (group?.jar_mode && !canDeleteMoneybox)}
            >
              {deleteGroup.isPending ? 'Deleting…' : (group?.jar_mode ? 'Delete Moneybox' : 'Delete group')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddRecurringSheet
        open={addRecurringOpen}
        onOpenChange={setAddRecurringOpen}
        group={group}
        onCreate={createRecurring}
      />

      <AddRecurringSheet
        open={!!editingRecurring}
        onOpenChange={(o) => { if (!o) setEditingRecurring(null) }}
        group={group}
        initial={editingRecurring}
        onUpdate={(data) => updateRecurring.mutateAsync({ recurringId: editingRecurring.id, ...data })}
      />


      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <SheetHeader className="mb-4">
            <SheetTitle>Members · {members.length}</SheetTitle>
          </SheetHeader>
          <div className="mb-4 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
            <div className="text-sm font-medium">Add members</div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-[var(--color-muted-foreground)]">From your contacts</div>
                <Link to="/contacts" className="text-xs text-[var(--color-primary)] font-medium">
                  Manage contacts
                </Link>
              </div>

              {contacts.length === 0 ? (
                <div className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                  No contacts yet. Add some contacts first, then add them to this group.
                </div>
              ) : contactsNotInGroup.length === 0 ? (
                <div className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                  All your contacts are already in this group.
                </div>
              ) : (
                <div className="space-y-1">
                  {contactsNotInGroup.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
                      <Avatar name={u.display_name} color={u.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.display_name}</div>
                        <div className="text-xs text-[var(--color-muted-foreground)] truncate">{u.handle}</div>
                      </div>
                        <Button
                          size="sm"
                          onClick={() => addUserToGroup(u)}
                          disabled={memberBusyId === u.id || pendingInviteUserIds.has(u.id)}
                        >
                          {pendingInviteUserIds.has(u.id) ? 'Invited' : 'Invite'}
                        </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[var(--color-muted-foreground)]">Search users</div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by handle or name"
                  className="pl-9"
                />
              </div>

              {memberSearch.trim().length > 0 && (
                <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                  {membersSearching ? (
                    <div className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">Searching…</div>
                  ) : (
                    memberSearchResults
                      .filter((u) => u.id !== me?.id)
                      .map((u, i) => {
                        const inGroup = groupMemberIds.has(u.id)
                        const invited = pendingInviteUserIds.has(u.id)
                        const isContact = contactIdSet.has(u.id)
                        return (
                          <div key={u.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                            <div className="flex items-center gap-3 px-3 py-2">
                              <Avatar name={u.display_name} color={u.color} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{u.display_name}</div>
                                <div className="text-xs text-[var(--color-muted-foreground)] truncate">{u.handle}</div>
                              </div>
                              {inGroup ? (
                                <Button size="sm" variant="secondary" disabled>
                                  Added
                                </Button>
                              ) : invited ? (
                                <Button size="sm" variant="secondary" disabled>
                                  Invited
                                </Button>
                              ) : isContact ? (
                                <Button size="sm" onClick={() => addUserToGroup(u)} disabled={memberBusyId === u.id}>
                                  Invite to group
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addUserToContactsAndGroup(u)}
                                  disabled={memberBusyId === u.id}
                                  className="gap-1.5"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  Add contact + group
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {members.map((m) => {
              const uid = m.id
              const isMe = uid === me?.id
              const memberBalance = balances?.members?.find((b) => b.user_id === uid)
              const net = memberBalance?.net_cents ?? null
              return (
                <div key={uid} className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
                  <Avatar name={m.display_name} color={m.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.display_name}
                      {isMe && <span className="text-xs text-[var(--color-muted-foreground)] font-normal"> (you)</span>}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">{m.handle}</div>
                  </div>
                  {net !== null && <BalancePill cents={net} currency={group?.currency || 'EUR'} />}
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function JarSection({ jar, me, isCreator, currency, onWithdraw, onDissolve }) {
  if (jar.isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-[var(--color-card-elevated)] animate-pulse" />)}
      </div>
    )
  }
  const d = jar.data
  if (!d) return null
  const cur = d.currency || currency

  return (
    <div className="space-y-4 mt-4">
      {/* Pot balance */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-5 text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-[var(--color-muted-foreground)]">Pot balance</span>
          {d.jar_closed && (
            <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]">Dissolved</span>
          )}
        </div>
        <div className="text-3xl font-bold tabular-nums">{formatMoney(d.pot_balance_cents, cur)}</div>
        <div className="flex justify-center gap-4 pt-1 text-xs text-[var(--color-muted-foreground)]">
          <span>↑ {formatMoney(d.total_contributed_cents, cur)} in</span>
          <span>↓ {formatMoney(d.total_withdrawn_cents, cur)} out</span>
        </div>
      </div>

      {/* Contributors */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="text-sm font-semibold">Contributors</div>
          <div className="text-xs text-[var(--color-muted-foreground)]">Dissolution returns proportional to contribution</div>
        </div>
        {(d.members || []).filter(m => m.contributed_cents > 0).length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No contributions yet.</div>
        ) : (
          (d.members || []).filter(m => m.contributed_cents > 0).map((m, i) => (
            <div key={m.user_id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-[var(--color-border)]')}>
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                style={{ background: m.color || '#0070D2' }}
              >
                {m.display_name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {m.display_name}
                  {m.user_id === me?.id && <span className="text-[var(--color-muted-foreground)] text-xs font-normal"> (you)</span>}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  {formatMoney(m.contributed_cents, cur)}
                  {d.total_contributed_cents > 0 && ` · ${Math.round(m.contributed_cents / d.total_contributed_cents * 100)}%`}
                </div>
              </div>
              {d.pot_balance_cents > 0 && m.refund_cents > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-[var(--color-muted-foreground)]">{d.jar_closed ? 'Received' : 'Would get'}</div>
                  <div className="text-sm font-semibold text-green-500 tabular-nums">{formatMoney(m.refund_cents, cur)}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Withdrawal history */}
      {(d.withdrawals || []).length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <div className="text-sm font-semibold">Withdrawals</div>
          </div>
          {d.withdrawals.map((w, i) => (
            <div key={w.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-[var(--color-border)]')}>
              <div className="h-9 w-9 rounded-full bg-red-500/15 flex items-center justify-center text-red-500 shrink-0 text-sm font-bold">↓</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{w.user?.display_name || 'Admin'}</div>
                {w.note && <div className="text-xs text-[var(--color-muted-foreground)] truncate">{w.note}</div>}
                <div className="text-xs text-[var(--color-muted-foreground)]">{new Date(w.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-sm font-semibold text-red-500 tabular-nums shrink-0">−{formatMoney(w.amount_cents, cur)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Creator actions */}
      {isCreator && d.pot_balance_cents > 0 && (
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={onWithdraw}>Withdraw</Button>
          {!d.jar_closed && (
            <Button className="flex-1" onClick={onDissolve}>Dissolve</Button>
          )}
        </div>
      )}
    </div>
  )
}

function GroupAction({ icon, label, onClick, href, primary }) {
  const GIcon = icon
  const cls = cn('flex flex-col items-center gap-1.5')
  const inner = (
    <>
      <div className={cn(
        'h-11 w-11 rounded-xl flex items-center justify-center transition-colors',
        primary
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-card-elevated)] border border-[var(--color-border)] text-[var(--color-primary)]',
      )}>
        <GIcon className="h-5 w-5" />
      </div>
      <span className="text-[11px] text-[var(--color-muted-foreground)] text-center">{label}</span>
    </>
  )
  if (href) return <Link to={href} className={cls}>{inner}</Link>
  return <button onClick={onClick} className={cls}>{inner}</button>
}

function MemberBalanceRow({ member, currency, isMe }) {
  const net = member.net_cents ?? 0
  const positive = net > 0
  const zero = Math.abs(net) < 1
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
        style={{ background: member.color || '#0070D2' }}
      >
        {member.display_name?.[0] || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">
          {member.display_name}{isMe && <span className="text-[var(--color-muted-foreground)] text-xs font-normal"> (you)</span>}
        </div>
        <div className="text-xs text-[var(--color-muted-foreground)]">
          {zero ? 'All settled' : positive ? `Owed ${formatMoney(Math.abs(net), currency)}` : `Owes ${formatMoney(Math.abs(net), currency)}`}
        </div>
      </div>
      <BalancePill cents={net} currency={currency} />
    </div>
  )
}

function EmptyExpenses({ onAdd }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-center py-14">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center text-2xl">
        🧾
      </div>
      <div className="mt-4 font-semibold">No expenses yet</div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Add your first shared expense to start tracking.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] text-white px-4 py-2 text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        Add expense
      </button>
    </div>
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

const FREQ_LABEL = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' }

function AddRecurringSheet({ open, onOpenChange, group, initial = null, onCreate, onUpdate }) {
  const { data: me } = useMe()
  const members = group?.members || []
  const currency = group?.currency || 'EUR'
  const { toast } = useToast()
  const isEdit = !!initial

  const [amount, setAmount] = useState(0)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('home')
  const [splitType, setSplitType] = useState('equal')
  const [split, setSplit] = useState([])
  const [frequency, setFrequency] = useState('monthly')

  useEffect(() => {
    if (open && initial) {
      setAmount(initial.amount_cents || 0)
      setTitle(initial.title || '')
      setCategory(initial.category || 'home')
      setFrequency(initial.frequency || 'monthly')
      setSplitType(initial.split_type || 'equal')
      setSplit(initial.custom_split || [])
    } else if (!open) {
      setAmount(0); setTitle(''); setCategory('home')
      setSplitType('equal'); setSplit([]); setFrequency('monthly')
    }
  }, [open, initial])

  useEffect(() => {
    if (open && !initial && splitType === 'equal' && members.length && amount > 0) {
      setSplit(distributeEqualSplit(amount, members.map((m) => m.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, splitType, amount, members.length])

  const canSubmit = useMemo(() => {
    if (amount <= 0 || !title.trim() || !me?.id) return false
    if (!isSplitReady({ splitType, split, amountCents: amount })) return false
    return true
  }, [amount, title, me, split, splitType])
  const splitBudgetStatus = useMemo(
    () => getCustomSplitBudgetStatus({ splitType, split, amountCents: amount }),
    [splitType, split, amount],
  )
  const splitGuidance = useMemo(() => {
    if (splitType !== 'custom' || amount <= 0) return null
    if (splitBudgetStatus.state === 'exact') {
      return {
        tone: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
        text: 'Split is exact. Ready to save.',
      }
    }
    if (splitBudgetStatus.state === 'under') {
      return {
        tone: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
        text: `${formatMoney(splitBudgetStatus.remainderCents, currency)} left to assign before saving.`,
      }
    }
    return {
      tone: 'text-[var(--color-destructive)] bg-[var(--color-destructive)]/10',
      text: `${formatMoney(splitBudgetStatus.remainderCents, currency)} over budget. Reduce shares to continue.`,
    }
  }, [splitType, amount, splitBudgetStatus, currency])

  const isPending = isEdit ? onUpdate?.isPending : onCreate?.isPending

  const submit = async () => {
    const splitPayload = resolveSplitPayload({
      splitType,
      split,
      forceCustom: true,
    })
    const payload = {
      title: title.trim(),
      amount_cents: amount,
      currency,
      category,
      paid_by: me.id,
      ...splitPayload,
      frequency,
    }
    try {
      if (isEdit) {
        await onUpdate(payload)
        toast({ variant: 'success', title: 'Recurring expense updated' })
      } else {
        await onCreate.mutateAsync(payload)
        toast({ variant: 'success', title: 'Recurring expense added' })
      }
      onOpenChange(false)
    } catch (err) {
      toast({ variant: 'error', title: isEdit ? 'Could not update' : 'Could not add', description: err.message })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetHeader>
        <SheetTitle>{isEdit ? 'Edit recurring expense' : 'Add recurring expense'}</SheetTitle>
        <SheetDescription>{group ? `Repeating in ${group.name}` : ''}</SheetDescription>
      </SheetHeader>

      <SheetContent className="space-y-6">
        {/* Amount */}
        <div className="rounded-2xl bg-[var(--color-secondary)] py-8">
          <MoneyInput value={amount} onChange={setAmount} currency={currency} autoFocus />
          <div className="mt-1 text-center text-xs text-[var(--color-muted-foreground)]">{currency}</div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="r-title">Title</Label>
          <Input id="r-title" className="mt-2" placeholder="e.g. Rent" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Frequency */}
        <div>
          <Label>Frequency</Label>
          <div className="mt-2 flex gap-2">
            {[['weekly', 'Weekly'], ['biweekly', 'Bi-weekly'], ['monthly', 'Monthly']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFrequency(val)}
                className={cn(
                  'flex-1 rounded-full border px-3 py-1.5 text-sm transition-all',
                  frequency === val
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-foreground)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
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
              currency={currency}
              splitType={splitType}
              onSplitTypeChange={setSplitType}
              split={split}
              onSplitChange={setSplit}
              payerId={me?.id}
            />
          </div>
          {splitGuidance && (
            <div className={cn('mt-2 rounded-lg px-3 py-2 text-xs', splitGuidance.tone)}>
              {splitGuidance.text}
            </div>
          )}
        </div>
      </SheetContent>

      <SheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={submit} disabled={!canSubmit || isPending}>
          {isPending
            ? 'Saving…'
            : splitType === 'custom' && splitBudgetStatus.state !== 'exact'
              ? 'Fix split to continue'
              : isEdit
                ? 'Save changes'
                : 'Confirm'}
        </Button>
      </SheetFooter>
    </Sheet>
  )
}
