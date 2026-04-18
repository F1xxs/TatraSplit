import { NavLink, Outlet, Link } from 'react-router-dom'
import { Home, Users, Activity, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useMe } from '@/hooks/useMe'
import { cn } from '@/lib/utils'
import { TatraMark } from './TatraMark'
import { BottomNav } from './BottomNav'

const navItems = [
  { to: '/',         icon: Home,     label: 'Overview' },
  { to: '/groups',   icon: Users,    label: 'Groups' },
  { to: '/activity', icon: Activity, label: 'Activity' },
]

export function AppShell() {
  const { data: me } = useMe()
  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 h-svh">
        <div className="p-5 border-b border-[var(--color-border)]">
          <Link to="/" className="flex items-center gap-3 group">
            <TatraMark className="h-7 w-7" />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Tatra<span className="text-[var(--color-primary)]">Split</span></div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                by Tatra banka
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-foreground)]'
                        : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-4 px-3">
            <Link to="/groups/new" className="block">
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                New group
              </Button>
            </Link>
          </div>
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          {me ? (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Avatar name={me.display_name} color={me.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{me.display_name}</div>
                <div className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {me.handle}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-2 py-2 text-xs text-[var(--color-muted-foreground)]">
              Signed out
            </div>
          )}
          <div className="mt-2 px-2 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Powered by <span className="text-[var(--color-info)] font-semibold">MongoDB Atlas</span>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar me={me} />
        <main className="flex-1 w-full mx-auto max-w-3xl lg:max-w-4xl px-4 pb-28 pt-6 lg:pt-10">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}

function TopBar({ me }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 glass border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <TatraMark className="h-6 w-6" />
          <div className="font-semibold tracking-tight">
            Tatra<span className="text-[var(--color-primary)]">Split</span>
          </div>
        </Link>
        {me && <Avatar name={me.display_name} color={me.color} size="sm" />}
      </div>
    </header>
  )
}
