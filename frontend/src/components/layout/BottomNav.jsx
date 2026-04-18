import { NavLink, useNavigate } from 'react-router-dom'
import { Home, ArrowLeftRight, ShoppingCart, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGroups } from '@/hooks/useGroups'
import { useToast } from '@/components/ui/toaster'

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/activity', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/groups', icon: ShoppingCart, label: 'Offers' },
]

export function BottomNav() {
  const { data: groups } = useGroups()
  const navigate = useNavigate()
  const { toast } = useToast()

  function handlePayment() {
    toast({ title: 'Feature not available in demo' })
  }

  function handleMore() {
    toast({ title: 'Feature not available in demo' })
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-[70] border-t border-white/15"
      style={{
        backgroundColor: 'var(--color-card-elevated)',
        backgroundImage: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        opacity: 1,
      }}
    >
      <div className="relative mx-auto grid max-w-3xl grid-cols-5 items-end px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] min-h-[88px]">
        <NavItem {...navItems[0]} />
        <NavItem {...navItems[1]} />

        <button
          onClick={handlePayment}
          className="relative -top-3 flex flex-col items-center justify-end gap-1 -mt-8"
          aria-label="Payment"  
        >
          <span className="relative flex h-[40px] w-[66px] items-start justify-center">
            <span className="absolute inset-x-0 top-0 h-[40px] rounded-t-full border-2 border-b-0 border-[#11a6ff]" />
            <svg
              viewBox="0 0 24 24"
              className="relative top-[12px] h-6 w-6 text-white"
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
          <span className="text-[11px] font-medium text-[var(--color-foreground)]">Payment</span>
        </button>

        <NavItem {...navItems[2]} />

        <button
          onClick={handleMore}
          className="flex h-[64px] flex-col items-center justify-center gap-1 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          aria-label="More"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[11px] font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-[64px] flex-col items-center justify-center gap-1 transition-colors',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-muted-foreground)]',
        )
      }
    >
      <Icon className="h-5 w-5" strokeWidth={1.9} />
      <span className="text-[11px] font-medium">{label}</span>
    </NavLink>
  )
}
