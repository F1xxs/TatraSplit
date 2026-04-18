import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityItem } from '@/components/shared/ActivityItem'
import { useActivity } from '@/hooks/useGroups'

export function ActivityPage() {
  const { data: items = [], isLoading } = useActivity()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Everything that happens across your groups.
        </p>
      </div>
      <Card>
        <CardContent className="pt-4 pb-4 px-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-sm text-[var(--color-muted-foreground)] py-12">
              Nothing yet. Add an expense to get started.
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((a) => (
                <ActivityItem key={a.id || a._id} item={a} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
