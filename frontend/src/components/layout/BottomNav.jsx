import { NavLink, useNavigate } from 'react-router-dom'
import { Home, ArrowLeftRight, CreditCard, LayoutGrid, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGroups } from '@/hooks/useGroups'
import { useToast } from '@/components/ui/toaster'

export function BottomNav() {
  const { data: groups } = useGroups()
  const navigate = useNavigate()
  const { toast } = useToast()

  function handlePayment() {
    const first = groups?.[0]
    if (first) {
      navigate(`/groups/${first._id || first.id}/expenses/new`)
    } else {
      navigate('/groups/new')
    }
  }

  function handleMore() {
    toast({ title: 'Feature not available in demo' })
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bank-bar">
      <div className="relative mx-auto flex max-w-3xl items-end justify-around px-1 pb-safe">
        <NavItem to="/" icon={Home} label="Home" end />
        <NavItem to="/activity" icon={ArrowLeftRight} label="Transactions" />
        {/* Center payment button */}
        <div className="flex flex-col items-center pb-2 pt-1">
          <button
            onClick={handlePayment}
            className="h-12 w-12 rounded-2xl bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center mb-0.5"
            aria-label="Payment"
          >
            <CreditCard className="h-5 w-5" />
          </button>
          <span className="text-[10px] text-[var(--color-muted-foreground)] font-medium">Payment</span>
        </div>
        <NavItem to="/groups" icon={LayoutGrid} label="Shared" />
        <button
          onClick={handleMore}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-medium text-[var(--color-muted-foreground)]"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  )
}

function NavItem({ to, icon, label, end }) {
  const NavIcon = icon
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-medium transition-colors',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-muted-foreground)]',
        )
      }
    >
      <NavIcon className="h-5 w-5" />
      {label}
    </NavLink>
  )
}
