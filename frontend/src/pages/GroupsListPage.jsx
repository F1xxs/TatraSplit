import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { GroupCard } from '@/components/shared/GroupCard'
import { DataState } from '@/components/shared/DataState'
import { useGroups } from '@/hooks/useGroups'
import { useContacts } from '@/hooks/useContacts'

export function GroupsListPage() {
  const { data: allGroups = [], isLoading, error, refetch } = useGroups()
  const groups = allGroups.filter(g => !g.jar_mode)
  const jarGroups = allGroups.filter(g => g.jar_mode && !g.jar_closed)
  const { data: contacts = [] } = useContacts()
  const contactUsers = contacts.map((c) => c.user).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Groups</h1>
        <Link
          to="/groups/new"
          className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="text-sm font-semibold">Contacts</div>
          <Link to="/contacts" className="text-xs text-[var(--color-primary)] font-medium">
            Manage
          </Link>
        </div>
        {contactUsers.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
            No contacts yet. Open Manage to add people.
          </div>
        ) : (
          <div>
            {contactUsers.slice(0, 4).map((u, i) => (
              <div key={u.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={u.display_name} color={u.color} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u.display_name}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)] truncate">{u.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide text-[11px]">Shared payments</span>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <DataState
            loading={isLoading}
            error={error}
            empty={groups.length === 0}
            emptyContent={
              <div className="text-center py-10 text-sm text-[var(--color-muted-foreground)]">
                No shared payments yet.{' '}
                <Link to="/groups/new" className="text-[var(--color-primary)]">Create one →</Link>
              </div>
            }
            onRetry={refetch}
            loadingRows={4}
          >
            <div>
              {groups.map((g, i) => (
                <div key={g.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                  <GroupCard group={g} />
                </div>
              ))}
            </div>
          </DataState>
        </div>
      </div>

      {(isLoading || jarGroups.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide text-[11px]">Moneyboxes</span>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-[var(--color-card-elevated)] animate-pulse" />)}
              </div>
            ) : (
              <div>
                {jarGroups.map((g, i) => (
                  <div key={g.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <GroupCard group={g} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
