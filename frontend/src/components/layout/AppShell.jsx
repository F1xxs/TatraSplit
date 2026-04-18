import { NavLink, Outlet, Link } from 'react-router-dom'
import { Home, ArrowLeftRight, LayoutGrid, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useMe } from '@/hooks/useMe'
import { cn } from '@/lib/utils'
import { TatraMark } from './TatraMark'
import { BottomNav } from './BottomNav'
import { useToast } from '@/components/ui/toaster'
import { useEffect } from 'react'

const navItems = [
  { to: '/',         icon: Home,             label: 'Home',            end: true },
  { to: '/activity', icon: ArrowLeftRight,   label: 'Transactions' },
  { to: '/groups',   icon: LayoutGrid,       label: 'Shared payments' },
]

export function AppShell() {
  const { data: me } = useMe()
  const { toast } = useToast()

  useEffect(() => {
    window.__tatraToast = (msg) => toast({ title: msg })
  }, [toast])

  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 h-svh">
        <div className="p-5 border-b border-[var(--color-border)]">
          <Link to="/" className="flex items-center gap-3">
            <TatraMark className="h-7 w-7 text-[var(--color-primary)]" />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">TatraSplit</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                by Tatra banka
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
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

          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <button
              onClick={() => toast({ title: 'Feature not available in demo' })}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
              More
            </button>
          </div>
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          {me ? (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Avatar name={me.display_name} color={me.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{me.display_name}</div>
                <div className="text-xs text-[var(--color-muted-foreground)] truncate">{me.handle}</div>
              </div>
            </div>
          ) : (
            <div className="px-2 py-2 text-xs text-[var(--color-muted-foreground)]">Loading…</div>
          )}
          <div className="mt-2 px-2 text-[10px] text-[var(--color-muted-foreground)]">
            Tatra banka, a.s. © 2026
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar me={me} />
        <main className="flex-1 w-full mx-auto max-w-3xl lg:max-w-4xl px-4 pb-28 pt-4 lg:pt-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}

function TopBar({ me }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bank-bar">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-2.5">
          <TatraMark className="h-6 w-6 text-[var(--color-primary)]" />
          <span className="font-semibold tracking-tight text-sm">TatraSplit</span>
        </Link>
        {me && <Avatar name={me.display_name} color={me.color} size="sm" />}
      </div>
    </header>
  )
}
