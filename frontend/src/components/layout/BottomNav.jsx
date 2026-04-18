import { NavLink, Link } from 'react-router-dom'
import { Home, Users, Activity, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/',         icon: Home,     label: 'Home' },
  { to: '/groups',   icon: Users,    label: 'Groups' },
  // Center "+" below
  { to: '/activity', icon: Activity, label: 'Activity' },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-[var(--color-border)]">
      <div className="relative mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        <NavItem {...items[0]} />
        <NavItem {...items[1]} />
        <div className="w-12" />
        <NavItem {...items[2]} />

        <Link
          to="/groups/new"
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xl shadow-[var(--color-primary)]/30 flex items-center justify-center"
          aria-label="New group"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  )
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-muted-foreground)]',
        )
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  )
}
