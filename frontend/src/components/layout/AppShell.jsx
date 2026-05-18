import { NavLink, Outlet, Link } from 'react-router-dom'
import { Users, LayoutGrid, Shield, ChevronsUpDown, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useMe } from '@/hooks/useMe'
import { useUsers } from '@/hooks/useGroups'
import { useLogin } from '@/hooks/useMutations'
import { cn } from '@/lib/utils'
import { getUserHandle, setUserHandle } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateGlobal } from '@/lib/invalidation'
import tatraLogo from '@/assets/tatra_logo.svg'

const navItems = [
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/groups',   icon: LayoutGrid, label: 'Groups' },
  { to: '/admin',    icon: Shield, label: 'Admin' },
]

export function AppShell() {
  const { data: me } = useMe()
  const { data: allUsers = [] } = useUsers()
  const login = useLogin()
  const qc = useQueryClient()

  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)

  // Bootstrap: if no handle stored yet, pick first available user
  useEffect(() => {
    if (getUserHandle() || allUsers.length === 0) return
    const first = allUsers[0]
    setUserHandle(first.handle)
    invalidateGlobal(qc)
  }, [allUsers, qc])

  // Close picker on outside click / Escape
  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e) => { if (!pickerRef.current?.contains(e.target)) setPickerOpen(false) }
    const onKey  = (e) => { if (e.key === 'Escape') setPickerOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  const handleSwitch = (user) => {
    setPickerOpen(false)
    login.mutate(user.handle)
  }

  const currentHandle = getUserHandle()
  const activeUser = me || allUsers.find((u) => u.handle === currentHandle) || allUsers[0]

  return (
    <div className="flex min-h-svh w-full">
      <aside className="w-64 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 h-svh">
        <div className="p-5 border-b border-[var(--color-border)]">
          <Link to="/groups" className="flex items-center gap-3">
            <img src={tatraLogo} alt="HackSplit" className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">HackSplit</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                Expense splitting
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-[var(--color-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              aria-haspopup="menu"
              aria-expanded={pickerOpen}
            >
              {activeUser ? (
                <>
                  <Avatar name={activeUser.display_name} color={activeUser.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{activeUser.display_name}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)] truncate">{activeUser.handle}</div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-[var(--color-muted-foreground)]">Select account…</div>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] shrink-0" aria-hidden />
            </button>

            {pickerOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-0 z-40 mb-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl max-h-72 overflow-y-auto"
              >
                {allUsers.map((user) => (
                  <Button
                    key={user.handle}
                    type="button"
                    variant="ghost"
                    role="menuitemradio"
                    aria-checked={currentHandle === user.handle}
                    className="h-auto w-full justify-start px-2 py-2 text-left"
                    onClick={() => handleSwitch(user)}
                  >
                    <Avatar name={user.display_name} color={user.color} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{user.display_name}</div>
                      <div className="truncate text-xs text-[var(--color-muted-foreground)]">{user.handle}</div>
                    </div>
                    {currentHandle === user.handle && (
                      <Check className="h-4 w-4 text-[var(--color-primary)] shrink-0" aria-hidden />
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
