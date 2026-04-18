import { NavLink } from 'react-router-dom'
import { Home, ArrowLeftRight, LayoutGrid, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/activity', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/groups', icon: LayoutGrid, label: 'Groups' },
]

export function BottomNav() {
  const { toast } = useToast()

  function handlePayment() {
    toast({ title: 'Feature not available in demo' })
  }

  function handleMore() {
    toast({ title: 'Feature not available in demo' })
  }

  return (
    <nav
      aria-label="Main navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-[70] border-t border-white/15"
      style={{
        backgroundColor: 'var(--color-card-elevated)',
        backgroundImage: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        opacity: 1,
      }}
    >
      <div className="relative mx-auto grid max-w-3xl grid-cols-5 items-end px-1 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.2rem)] min-h-[76px]">
        <NavItem {...navItems[0]} />
        <NavItem {...navItems[1]} />

        <button
          onClick={handlePayment}
          className="relative -top-2 flex flex-col items-center justify-end gap-0.5 -mt-6"
          aria-label="Payment"
        >
          <span className="relative flex h-[34px] w-[56px] items-start justify-center">
            <span className="absolute inset-x-0 top-0 h-[34px] rounded-t-full border-2 border-b-0 border-[#11a6ff]" />
            <svg
              viewBox="0 0 24 24"
              className="relative top-[9px] h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4v7" />
              <path d="M9 7l3-3 3 3" />
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M4 14h16" />
            </svg>
          </span>
          <span className="text-[10px] font-medium text-[var(--color-foreground)]">Payment</span>
        </button>

        <NavItem {...navItems[2]} />

        <button
          onClick={handleMore}
          className="flex h-14 flex-col items-center justify-center gap-0.5 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          aria-label="More"
        >
          <Menu className="h-[18px] w-[18px]" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}

function NavItem({ to, icon: NavIcon, label, end = false }) {
  const Icon = NavIcon
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-14 flex-col items-center justify-center gap-0.5 transition-colors',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-muted-foreground)]',
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}
