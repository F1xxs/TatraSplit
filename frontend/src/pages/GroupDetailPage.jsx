import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, Coins, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarStack } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ExpenseRow } from '@/components/shared/ExpenseRow'
import { BalancePill } from '@/components/shared/BalancePill'
import { CategoryDonut, CategoryLegend } from '@/components/shared/CategoryDonut'
import { ActivityItem } from '@/components/shared/ActivityItem'
import { QRInviteDialog } from '@/components/shared/QRInviteDialog'
import { AddExpenseSheet } from './AddExpensePage'
import { useMe } from '@/hooks/useMe'
import {
  useGroup,
  useGroupExpenses,
  useGroupBalances,
  useGroupActivity,
} from '@/hooks/useGroups'
import { formatMoney } from '@/lib/format'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function GroupDetailPage() {
  const { id } = useParams()
  const { data: group, isLoading } = useGroup(id)
  const { data: expenses = [] } = useGroupExpenses(id)
  const { data: balances } = useGroupBalances(id)
  const { data: activity = [] } = useGroupActivity(id)
  const { data: me } = useMe()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

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
    balances?.members?.find(
      (m) => m.user_id === me?.id || m.user_id === me?._id,
    )?.net_cents ?? 0

  const categoryData = aggregateByCategory(expenses)

  return (
    <div className="space-y-4">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Shared payments
      </Link>

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

            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wide">Your balance</div>
              <BalancePill cents={myNet} currency={group?.currency || 'EUR'} size="lg" />
            </div>
          </>
        )}
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-4 gap-3">
        <GroupAction icon={Plus} label="Add expense" onClick={() => setAddOpen(true)} primary />
        <GroupAction icon={Coins} label="Settle up" href={`/groups/${id}/settle`} />
        <GroupAction icon={Share2} label="Invite" onClick={openInvite} />
        <GroupAction icon={Users} label="Members" onClick={() => setMembersOpen(true)} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses">
        <TabsList className="w-full rounded-none border-b border-[var(--color-border)] bg-transparent p-0 h-auto">
          {['expenses', 'balances', 'activity'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 rounded-none border-b-2 border-transparent pb-3 pt-1 text-sm font-medium capitalize text-[var(--color-muted-foreground)] data-[state=active]:border-[var(--color-primary)] data-[state=active]:text-[var(--color-foreground)] data-[state=active]:shadow-none bg-transparent"
            >
              {tab === 'expenses' ? 'Expenses' : tab === 'balances' ? 'Balances' : 'Activity'}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          {expenses.length === 0 ? (
            <EmptyExpenses onAdd={() => setAddOpen(true)} />
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              {groupExpensesByDate(expenses).map(({ date, items }) => (
                <div key={date}>
                  <div className="px-4 py-2 text-[11px] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)] bg-[var(--color-card-elevated)]">
                    {date}
                  </div>
                  {items.map((e, i) => (
                    <div key={e.id || e._id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
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
          )}
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
                      isMe={m.user_id === me?.id || m.user_id === me?._id}
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
            {activity.length === 0 ? (
              <div className="text-center text-sm text-[var(--color-muted-foreground)] py-12">
                No activity yet.
              </div>
            ) : (
              <div>
                {activity.map((a, i) => (
                  <div key={a.id || a._id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <ActivityItem item={a} className="px-4" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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

      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Members · {members.length}</SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            {members.map((m) => {
              const uid = m.id || m._id
              const isMe = uid === me?.id || uid === me?._id
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

function GroupAction({ icon, label, onClick, href, primary }) {
  const GIcon = icon
  const cls = cn('flex flex-col items-center gap-1.5')
  const inner = (
    <>
      <div className={cn(
        'h-8 w-8 rounded-xl flex items-center justify-center transition-colors',
        primary
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-card-elevated)] border border-[var(--color-border)] text-[var(--color-primary)]',
      )}>
        <GIcon className="h-3.5 w-3.5" />
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
