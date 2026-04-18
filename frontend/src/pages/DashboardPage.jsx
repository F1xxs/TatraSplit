import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, TrendingUp, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupCard } from '@/components/shared/GroupCard'
import { CategoryDonut, CategoryLegend } from '@/components/shared/CategoryDonut'
import { ActivityItem } from '@/components/shared/ActivityItem'
import { useMe, useMeBalances } from '@/hooks/useMe'
import { useGroups, useActivity } from '@/hooks/useGroups'
import { formatMoney } from '@/lib/format'

export function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe()
  const { data: balances, isLoading: balLoading } = useMeBalances()
  const { data: groups = [], isLoading: groupsLoading } = useGroups()
  const { data: activity = [], isLoading: actLoading } = useActivity()

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {meLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>Hi, {me?.display_name?.split(' ')[0] || 'there'} 👋</>
          )}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Here's where you stand across all your groups.
        </p>
      </div>

      {/* Balance hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BalanceTile
          label="You are owed"
          amountCents={balances?.total_owed_to_me_cents}
          currency="EUR"
          positive
          loading={balLoading}
        />
        <BalanceTile
          label="You owe"
          amountCents={balances?.total_i_owe_cents}
          currency="EUR"
          loading={balLoading}
        />
      </div>

      {/* Spending + Activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3" elevated>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Spending by category</CardTitle>
                <CardDescription>Last 30 days across your groups</CardDescription>
              </div>
              <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {balLoading ? (
              <Skeleton className="h-[180px] w-full rounded-xl" />
            ) : (
              <>
                <CategoryDonut data={balances?.by_category_last_30d || []} />
                <CategoryLegend data={balances?.by_category_last_30d || []} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Recent activity</CardTitle>
              <Link
                to="/activity"
                className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {actLoading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center text-sm text-[var(--color-muted-foreground)] py-6">
                No activity yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {activity.slice(0, 5).map((a) => (
                  <ActivityItem key={a.id || a._id} item={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Your groups</h2>
          <Link to="/groups">
            <Button variant="ghost" size="sm">
              All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {groupsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyGroups />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.map((g) => (
              <GroupCard key={g.id || g._id} group={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function BalanceTile({ label, amountCents, currency = 'EUR', positive, loading }) {
  const color = positive ? 'text-[var(--color-success)]' : 'text-[var(--color-destructive)]'
  const bg = positive
    ? 'bg-[var(--color-success)]/10 ring-[var(--color-success)]/20'
    : 'bg-[var(--color-destructive)]/10 ring-[var(--color-destructive)]/20'
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-6 relative overflow-hidden`}
    >
      <div className={`absolute -top-8 -right-8 h-32 w-32 rounded-full ring-8 ${bg}`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
          <div className={`h-6 w-6 rounded-md flex items-center justify-center ${bg}`}>
            <Icon className={`h-3.5 w-3.5 ${color}`} strokeWidth={2.5} />
          </div>
          {label}
        </div>
        <div className={`mt-3 text-4xl font-semibold tabular-nums ${color}`}>
          {loading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            formatMoney(amountCents || 0, currency)
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyGroups() {
  return (
    <Card className="text-center py-10">
      <CardContent className="pt-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center text-2xl">
          👥
        </div>
        <div className="mt-4 font-semibold">No groups yet</div>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Start a group with roommates, friends, or trip buddies.
        </p>
        <Link to="/groups/new" className="inline-block mt-4">
          <Button>Create your first group</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
