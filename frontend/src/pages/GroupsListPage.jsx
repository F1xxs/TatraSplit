import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupCard } from '@/components/shared/GroupCard'
import { useGroups } from '@/hooks/useGroups'

export function GroupsListPage() {
  const { data: groups = [], isLoading } = useGroups()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {groups.length} group{groups.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link to="/groups/new">
          <Button>
            <Plus className="h-4 w-4" />
            New group
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-sm text-[var(--color-muted-foreground)]">
          No groups yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.map((g) => (
            <GroupCard key={g.id || g._id} group={g} />
          ))}
        </div>
      )}
    </div>
  )
}
