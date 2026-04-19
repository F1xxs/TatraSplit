import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  LayoutGrid,
  MoreHorizontal,
  Mail,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useMe } from '@/hooks/useMe'
import { cn } from '@/lib/utils'
import tatraLogo from '@/assets/tatra_logo.svg'
import { BottomNav } from './BottomNav'
import { useToast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { invalidateGlobal } from '@/lib/invalidation'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useGroupInvites } from '@/hooks/useGroups'
import { InboxSheet } from '@/components/shared/InboxSheet'
import { PullToRefresh } from '@/components/shared/PullToRefresh'

const navItems = [
  { to: '/',         icon: Home,             label: 'Home',            end: true },
  { to: '/activity', icon: ArrowLeftRight,   label: 'Transactions' },
  { to: '/groups',   icon: LayoutGrid,       label: 'Shared payments' },
]

const demoAccounts = [
  { handle: '@misha', display_name: 'Misha F.', color: '#14B8A6' },
  { handle: '@lukas', display_name: 'Lukáš N.', color: '#8B5CF6' },
  { handle: '@nina', display_name: 'Nina K.', color: '#F97316' },
  { handle: '@tomas', display_name: 'Tomáš B.', color: '#3B82F6' },
]

function getStoredHandle() {
  return localStorage.getItem('tatrasplit_user_handle') || '@misha'
}

export function AppShell() {
  const { data: me } = useMe()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [selectedHandle, setSelectedHandle] = useState(getStoredHandle)
  const accountMenuRef = useRef(null)
  const accountItemRefs = useRef([])

  useEffect(() => {
    window.__tatraToast = (msg) => toast({ title: msg })
  }, [toast])

  useEffect(() => {
    if (!accountMenuOpen) return

    const onPointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onEscape)
    }
  }, [accountMenuOpen])

  const selectedAccount =
    demoAccounts.find((account) => account.handle === selectedHandle) || demoAccounts[0]
  const activeIdentity = me?.handle === selectedHandle ? me : selectedAccount
  const currentHandle = selectedHandle

  const handleSelectAccount = (handle) => {
    localStorage.setItem('tatrasplit_user_handle', handle)
    setSelectedHandle(handle)
    setAccountMenuOpen(false)
    invalidateGlobal(qc)
  }

  const [inboxOpen, setInboxOpen] = useState(false)
  const [mobileSwitcherOpen, setMobileSwitcherOpen] = useState(false)
  const { data: invites = [] } = useGroupInvites()
  const inviteCount = invites.length

  return (
    <>
    <InboxSheet open={inboxOpen} onOpenChange={setInboxOpen} />

    {/* Mobile account switcher sheet */}
    {mobileSwitcherOpen && (
      <div className="lg:hidden fixed inset-0 z-[80] flex flex-col justify-end" onClick={() => setMobileSwitcherOpen(false)}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative bg-[var(--color-card)] rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-4" />
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-3 mb-2">Demo accounts</div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
          {demoAccounts.map((account) => (
            <button
              key={account.handle}
              type="button"
              onClick={() => { handleSelectAccount(account.handle); setMobileSwitcherOpen(false) }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--color-secondary)] transition-colors"
            >
              <Avatar name={account.display_name} color={account.color} size="sm" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{account.display_name}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">{account.handle}</div>
              </div>
              {selectedHandle === account.handle && (
                <Check className="h-4 w-4 text-[var(--color-primary)]" />
              )}
            </button>
          ))}
          </div>
        </div>
      </div>
    )}
    <div className="flex min-h-svh w-full">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 h-svh">
        <div className="p-5 border-b border-[var(--color-border)]">
          <Link to="/" className="flex items-center gap-3">
            <img src={tatraLogo} alt="Tatra banka" className="h-13 w-13  object-contain" />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">TatraSplit</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                by Tatra banka
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
                  <item.icon className="h-4 w-4" aria-hidden />
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
              <MoreHorizontal className="h-4 w-4" aria-hidden />
              More
            </button>
          </div>
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          {activeIdentity ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' && !accountMenuOpen) {
                    event.preventDefault()
                    setAccountMenuOpen(true)
                    requestAnimationFrame(() => accountItemRefs.current[0]?.focus())
                  }
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-[var(--color-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]"
                aria-label="Open account switcher menu"
                aria-haspopup="menu"
                aria-controls="account-switcher-menu"
                aria-expanded={accountMenuOpen}
              >
                <Avatar name={activeIdentity.display_name} color={activeIdentity.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{activeIdentity.display_name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)] truncate">{activeIdentity.handle}</div>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" aria-hidden />
              </button>

              <div
                id="account-switcher-menu"
                role="menu"
                aria-label="Switch demo account"
                className={cn(
                  'absolute bottom-full left-0 z-40 mb-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl max-h-72 overflow-y-auto',
                  accountMenuOpen ? 'block' : 'hidden',
                )}
              >
                {demoAccounts.map((account, index) => (
                  <Button
                    key={account.handle}
                    ref={(node) => {
                      accountItemRefs.current[index] = node
                    }}
                    type="button"
                    variant="ghost"
                    role="menuitemradio"
                    aria-checked={currentHandle === account.handle}
                    className="h-auto w-full justify-start px-2 py-2 text-left"
                    onClick={() => handleSelectAccount(account.handle)}
                  >
                    <Avatar name={account.display_name} color={account.color} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{account.display_name}</div>
                      <div className="truncate text-xs text-[var(--color-muted-foreground)]">{account.handle}</div>
                    </div>
                    {currentHandle === account.handle && <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
                  </Button>
                ))}
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
        <TopBar me={activeIdentity} onStub={() => toast({ title: 'Feature not available in demo' })} onInbox={() => setInboxOpen(true)} inviteCount={inviteCount} onSwitchAccount={() => setMobileSwitcherOpen(true)} />
        <main className="flex-1 w-full mx-auto max-w-3xl lg:max-w-4xl px-4 pb-[calc(env(safe-area-inset-bottom)+9.25rem)] pt-4 lg:pb-10 lg:pt-8">
          <PullToRefresh>
            <Outlet />
          </PullToRefresh>
        </main>
        <BottomNav />
      </div>
    </div>
    </>
  )
}

function TopBar({ me, onStub, onInbox, inviteCount = 0, onSwitchAccount }) {
  const location = useLocation()
  const isDashboard = location.pathname === '/'

  return (
    <header className="lg:hidden sticky top-0 z-30 bank-bar shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <div
        className={cn(
          'px-4 h-14',
          isDashboard
            ? 'grid grid-cols-[1fr_auto_1fr] items-center'
            : 'flex items-center justify-between',
        )}
      >
        {isDashboard ? (
          <>
            <button
              onClick={onInbox}
              className="justify-self-start relative text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              aria-label="Inbox"
            >
              <Mail className="h-5 w-5" />
              {inviteCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white">
                  {inviteCount > 9 ? '9+' : inviteCount}
                </span>
              )}
            </button>
            <Link to="/" className="justify-self-center flex items-center" aria-label="Tatra banka">
              <img src={tatraLogo} alt="Tatra banka" className="h-15 w-15 object-contain" />
            </Link>
            <button
              onClick={onSwitchAccount}
              className="justify-self-end"
              aria-label="Switch account"
            >
              {me && <Avatar name={me.display_name} color={me.color} size="sm" />}
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2.5">
              <img src={tatraLogo} alt="Tatra banka" className="h-13 w-13 object-contain" />
            </Link>
            {me && (
              <button onClick={onSwitchAccount} aria-label="Switch account">
                <Avatar name={me.display_name} color={me.color} size="sm" />
              </button>
            )}
          </>
        )}
      </div>
    </header>
  )
}
