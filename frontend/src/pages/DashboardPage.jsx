import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight, CreditCard, Building2, RefreshCw,
  Share2, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupCard } from '@/components/shared/GroupCard'
import { BankTransactionRow } from '@/components/shared/ActivityItem'
import { DataState } from '@/components/shared/DataState'
import { useMe, useMeBalances } from '@/hooks/useMe'
import { useGroups, useActivity } from '@/hooks/useGroups'
import { formatMoney } from '@/lib/format'
import { useToast } from '@/components/ui/toaster'

const STUB_IBAN = 'SK18 1100 1111 1111 3294 5724'

export function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe()
  const { isLoading: balLoading } = useMeBalances()
  const { data: groups = [], isLoading: groupsLoading, error: groupsError, refetch: refetchGroups } = useGroups()
  const { data: activity = [], isLoading: actLoading, error: actError, refetch: refetchAct } = useActivity()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [cardIdx, setCardIdx] = useState(0)

  const walletBalance = me?.balance_cents ?? 0
  const walletCurrency = me?.currency || 'EUR'
  const firstName = me?.display_name?.split(' ')[0] || ''
  const lastName = me?.display_name?.split(' ').slice(1).join(' ') || ''

  function copyIban() {
    navigator.clipboard?.writeText(STUB_IBAN.replace(/\s/g, ''))
    toast({ title: 'IBAN copied to clipboard' })
  }

  function stub() {
    toast({ title: 'Feature not available in demo' })
  }

  const cards = [
    { type: 'tatra', label: 'TatraSplit Account' },
    { type: 'visa', label: 'Visa **** 0374' },
  ]

  return (
    <div className="space-y-6">
      {/* Accounts section */}
      <section>
        <h2 className="text-base font-semibold mb-3">Accounts</h2>

        {/* Card carousel */}
        <div className="relative">
          {cardIdx === 0 ? (
            /* Real account card */
            <div className="rounded-2xl bg-[var(--color-card-elevated)] border border-[var(--color-border)] p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  {meLoading ? (
                    <Skeleton className="h-5 w-36 mb-1" />
                  ) : (
                    <div className="font-semibold text-sm truncate">
                      {lastName} {firstName}
                    </div>
                  )}
                  <div className="text-[11px] text-[var(--color-muted-foreground)] font-mono mt-0.5">
                    {STUB_IBAN}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wide">
                    Account balance
                  </div>
                  {(balLoading || meLoading) ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                  ) : (
                    <div className="text-3xl font-bold tabular-nums mt-1">
                      {formatMoney(walletBalance, walletCurrency)}
                    </div>
                  )}
                </div>
                {/* Mini sparkline stub */}
                <div className="w-20 h-10 opacity-40">
                  <svg viewBox="0 0 80 40" fill="none" className="w-full h-full">
                    <polyline points="0,30 20,20 40,25 60,10 80,15" stroke="#1DB954" strokeWidth="2" fill="none" />
                    <polygon points="0,30 20,20 40,25 60,10 80,15 80,40 0,40" fill="#1DB954" fillOpacity="0.15" />
                  </svg>
                </div>
              </div>

              {/* Account actions */}
              <div className="mt-1 pt-4 border-t border-[var(--color-border)] flex gap-4">
                <button
                  onClick={copyIban}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Share IBAN
                </button>
                <button
                  onClick={stub}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium"
                >
                  <CreditCard className="h-4 w-4" />
                  Request payment
                </button>
              </div>
            </div>
          ) : (
            /* Dummy Visa card */
            <button
              onClick={stub}
              className="w-full rounded-2xl bg-[#111114] border border-[var(--color-border)] p-5 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] text-[var(--color-muted-foreground)] mb-1">
                    {me?.display_name}
                  </div>
                  <div className="font-mono text-sm tracking-widest">
                    4444 77** **** 9999
                  </div>
                </div>
                <span className="text-lg font-bold italic text-white/80">VISA</span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-[var(--color-muted-foreground)]">Disposable balance</div>
                  <div className="text-2xl font-bold tabular-nums mt-0.5">1 563,34 EUR</div>
                </div>
              </div>
            </button>
          )}

          {/* Carousel nav */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setCardIdx((i) => Math.max(0, i - 1))}
              disabled={cardIdx === 0}
              aria-label="Previous card"
              className="p-1 text-[var(--color-muted-foreground)] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="flex gap-1.5" role="tablist" aria-label="Account cards">
              {cards.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setCardIdx(i)}
                  role="tab"
                  aria-selected={i === cardIdx}
                  aria-label={c.label}
                  className={`h-1.5 rounded-full transition-all ${i === cardIdx ? 'w-5 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--color-border)]'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCardIdx((i) => Math.min(cards.length - 1, i + 1))}
              disabled={cardIdx === cards.length - 1}
              aria-label="Next card"
              className="p-1 text-[var(--color-muted-foreground)] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction
            icon={ArrowLeftRight}
            label="Transactions"
            onClick={() => navigate('/activity')}
          />
          <QuickAction
            icon={CreditCard}
            label="Payment"
            onClick={() => navigate('/payment')}
          />
          <QuickAction icon={Building2} label="ATM" onClick={stub} />
          <QuickAction icon={RefreshCw} label="Standing" onClick={stub} />
        </div>
      </section>

      {/* Shared payments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Shared payments</h2>
          <Link to="/groups" className="text-sm text-[var(--color-primary)] font-medium">
            All
          </Link>
        </div>
        <DataState
          loading={groupsLoading}
          error={groupsError}
          empty={groups.length === 0}
          emptyContent={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
              <div className="text-sm text-[var(--color-muted-foreground)]">No shared payments yet.</div>
              <Link to="/groups/new" className="mt-2 inline-block text-sm text-[var(--color-primary)] font-medium">
                Create group →
              </Link>
            </div>
          }
          loadingRows={2}
          onRetry={refetchGroups}
        >
          <div className="space-y-2">
            {groups.slice(0, 3).map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        </DataState>
      </section>

      {/* Recent transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent transactions</h2>
          <Link to="/activity" className="text-sm text-[var(--color-primary)] font-medium">
            All
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <DataState
            loading={actLoading}
            error={actError}
            empty={activity.length === 0}
            emptyMessage="No transactions yet."
            onRetry={refetchAct}
            loadingRows={3}
          >
            <div>
              {activity.slice(0, 5).map((a, i) => (
                <BankTransactionRow key={a.id} item={a} border={i > 0} />
              ))}
            </div>
          </DataState>
        </div>
      </section>
    </div>
  )
}

function QuickAction({ icon, label, onClick }) {
  const QIcon = icon
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="h-14 w-14 rounded-2xl bg-[var(--color-card-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-accent)] transition-colors">
        <QIcon className="h-5 w-5" />
      </div>
      <span className="text-[11px] text-[var(--color-muted-foreground)] text-center leading-tight">
        {label}
      </span>
    </button>
  )
}
