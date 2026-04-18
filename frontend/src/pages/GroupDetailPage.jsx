import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, Coins, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack } from '@/components/ui/avatar'
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
import { formatMoney, getCategory } from '@/lib/format'
import { api } from '@/lib/api'

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

  const openInvite = async () => {
    try {
      const res = await api.get(`/groups/${id}/invite`)
      setInvite(res.data)
    } catch {
      /* fallback to group's own token */
      setInvite({ invite_token: group?.invite_token })
    }
    setInviteOpen(true)
  }

  const members = group?.members || []
  const myNet =
    balances?.members?.find(
      (m) => m.user_id === me?.id || m.user_id === me?._id,
    )?.net_cents ?? 0

  // Category rollup for this group
  const categoryData = aggregateByCategory(expenses)

  return (
    <div className="space-y-6">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        All groups
      </Link>

      {/* Header card */}
      <Card elevated>
        <CardContent className="pt-6 pb-6">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-secondary)] text-3xl">
                <span role="img" aria-hidden>
                  {group?.emoji || '👥'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight truncate">
                  {group?.name}
                </h1>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  <AvatarStack users={members} size="sm" max={6} />
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {members.length} member{members.length === 1 ? '' : 's'} · {group?.currency || 'EUR'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Your balance
                  </div>
                  <BalancePill cents={myNet} currency={group?.currency || 'EUR'} size="lg" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
            <Link to={`/groups/${id}/settle`}>
              <Button variant="secondary">
                <Coins className="h-4 w-4" />
                Settle up
              </Button>
            </Link>
            <Button variant="outline" onClick={openInvite}>
              <Share2 className="h-4 w-4" />
              Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {expenses.length === 0 ? (
            <EmptyExpenses onAdd={() => setAddOpen(true)} />
          ) : (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col divide-y divide-[var(--color-border)]/60">
                  {groupExpensesByDate(expenses).map(({ date, items }) => (
                    <div key={date} className="py-2 first:pt-0 last:pb-0">
                      <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                        {date}
                      </div>
                      {items.map((e) => (
                        <ExpenseRow
                          key={e.id || e._id}
                          expense={e}
                          me={me}
                          members={members}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="balances">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Who owes what</CardTitle>
                <CardDescription>Net balances inside this group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(balances?.members || []).map((m) => (
                  <MemberBalanceBar
                    key={m.user_id}
                    member={m}
                    currency={group?.currency || 'EUR'}
                    isMe={m.user_id === me?.id || m.user_id === me?._id}
                  />
                ))}
                {(!balances || balances.members?.length === 0) && (
                  <div className="text-sm text-[var(--color-muted-foreground)] py-6 text-center">
                    No balances yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Spending split by category</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryDonut data={categoryData} currency={group?.currency || 'EUR'} />
                <CategoryLegend data={categoryData} currency={group?.currency || 'EUR'} />
              </CardContent>
            </Card>
          </div>

          {balances?.simplified_transfers?.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Simplified settle-up</CardTitle>
                    <CardDescription>
                      {balances.simplified_transfers.length} transfer
                      {balances.simplified_transfers.length === 1 ? '' : 's'} resolves everything
                    </CardDescription>
                  </div>
                  <Link to={`/groups/${id}/settle`} className="ml-auto">
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-4 pb-3 px-2">
              {activity.length === 0 ? (
                <div className="text-center text-sm text-[var(--color-muted-foreground)] py-10">
                  No activity yet.
                </div>
              ) : (
                <div className="flex flex-col">
                  {activity.map((a) => (
                    <ActivityItem key={a.id || a._id} item={a} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
    </div>
  )
}

function EmptyExpenses({ onAdd }) {
  return (
    <Card className="text-center py-14">
      <CardContent className="pt-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center text-2xl">
          🧾
        </div>
        <div className="mt-4 font-semibold">No expenses yet</div>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Add your first shared expense to start tracking.
        </p>
        <Button onClick={onAdd} className="mt-4">
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </CardContent>
    </Card>
  )
}

function MemberBalanceBar({ member, currency, isMe }) {
  const net = member.net_cents ?? 0
  const positive = net > 0
  const zero = Math.abs(net) < 1
  return (
    <div className="rounded-xl px-3 py-2 hover:bg-[var(--color-secondary)]/60 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ background: member.color || 'hsl(263 82% 72%)' }}
          >
            {member.display_name?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {member.display_name} {isMe && <span className="text-[var(--color-muted-foreground)] text-xs">(you)</span>}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {zero
                ? 'all settled'
                : positive
                  ? `is owed ${formatMoney(Math.abs(net), currency)}`
                  : `owes ${formatMoney(Math.abs(net), currency)}`}
            </div>
          </div>
        </div>
        <BalancePill cents={net} currency={currency} />
      </div>
    </div>
  )
}

function groupExpensesByDate(expenses) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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
  return Array.from(map.entries()).map(([category, spent_cents]) => ({
    category,
    spent_cents,
  }))
}
