import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupCard } from '@/components/shared/GroupCard'
import { useGroups } from '@/hooks/useGroups'

export function GroupsListPage() {
  const { data: groups = [], isLoading } = useGroups()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Shared payments</h1>
        <Link
          to="/groups/new"
          className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-sm text-[var(--color-muted-foreground)]">
            No shared payments yet.{' '}
            <Link to="/groups/new" className="text-[var(--color-primary)]">
              Create one →
            </Link>
          </div>
        ) : (
          <div>
            {groups.map((g, i) => (
              <div key={g.id || g._id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                <GroupCard group={g} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
