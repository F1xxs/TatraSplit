import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Search, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { useMe } from '@/hooks/useMe'
import { useUsers } from '@/hooks/useGroups'
import { usePayment } from '@/hooks/useMutations'
import { formatMoney } from '@/lib/format'
import { useToast } from '@/components/ui/toaster'

export function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: me } = useMe()
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const payment = usePayment()
  const { toast } = useToast()

  const prefillHandle = searchParams.get('to') || ''
  const prefillUserId = searchParams.get('toUser') || ''
  const prefillAmountRaw = Number.parseInt(searchParams.get('amount') || '0', 10)
  const prefillAmount = Number.isInteger(prefillAmountRaw) && prefillAmountRaw > 0 ? prefillAmountRaw : 0
  const groupId = searchParams.get('groupId') || ''

  const [step, setStep] = useState('form')
  const [search, setSearch] = useState('')
  const [amountCents, setAmountCents] = useState(prefillAmount)
  const [note, setNote] = useState('')
  const [manualRecipient, setManualRecipient] = useState(null)
  const [ignorePrefill, setIgnorePrefill] = useState(false)
  const [lastPayment, setLastPayment] = useState(null)

  const currency = me?.currency || 'EUR'
  const meId = me?.id

  const availableRecipients = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users
      .filter((u) => u.id !== meId)
      .filter((u) => {
        if (!term) return true
        return (
          u.display_name?.toLowerCase().includes(term) ||
          u.handle?.toLowerCase().includes(term)
        )
      })
      .slice(0, 8)
  }, [users, meId, search])

  const prefilledRecipient = useMemo(() => {
    if (!users.length) return null
    if (!prefillHandle && !prefillUserId) return null
    const fromParams = users.find((u) => {
      if (prefillUserId && u.id === prefillUserId) return true
      return prefillHandle && u.handle?.toLowerCase() === prefillHandle.toLowerCase()
    })
    if (fromParams?.id === meId) return null
    return fromParams || null
  }, [users, prefillHandle, prefillUserId, meId])

  const recipient = manualRecipient || (!ignorePrefill ? prefilledRecipient : null)

  const isSelfRecipient = recipient && recipient.id === meId
  const canContinue = !!recipient && amountCents > 0 && !isSelfRecipient
  const canSend = canContinue && !payment.isPending

  function handleContinue() {
    if (!recipient) {
      toast({ variant: 'error', title: 'Select recipient', description: 'Choose who you want to pay.' })
      return
    }
    if (recipient.id === meId) {
      toast({ variant: 'error', title: 'Invalid recipient', description: 'You cannot pay yourself.' })
      return
    }
    if (amountCents <= 0) {
      toast({ variant: 'error', title: 'Enter amount', description: 'Amount must be greater than zero.' })
      return
    }
    setStep('confirm')
  }

  async function handleSend() {
    if (!recipient || !meId || !canSend) return

    setStep('processing')
    const startedAt = Date.now()
    try {
      const result = await payment.mutateAsync({
        from_user: meId,
        to_user: recipient.id,
        to_handle: recipient.handle,
        amount_cents: amountCents,
        currency,
        note: note.trim(),
        group_id: groupId || undefined,
      })
      const elapsed = Date.now() - startedAt
      if (elapsed < 1200) {
        await new Promise((resolve) => setTimeout(resolve, 1200 - elapsed))
      }
      setLastPayment(result)
      setStep('success')
    } catch (error) {
      setStep('confirm')
      toast({
        variant: 'error',
        title: 'Payment failed',
        description: error?.message || 'Could not process payment.',
      })
    }
  }

  function handleMakeAnother() {
    setStep('form')
    setAmountCents(0)
    setNote('')
    setManualRecipient(null)
    setIgnorePrefill(true)
    setSearch('')
    setLastPayment(null)
  }

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-(--color-foreground)"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {step === 'form' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h1 className="text-lg font-semibold">Make payment</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Send money to another user in the demo app.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Recipient
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or handle"
                className="pl-9"
              />
            </div>

            {recipient && (
              <button
                onClick={() => {
                  setManualRecipient(null)
                  setIgnorePrefill(true)
                }}
                className="w-full rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={recipient.display_name} color={recipient.color} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{recipient.display_name}</div>
                    <div className="truncate text-xs text-[var(--color-muted-foreground)]">{recipient.handle}</div>
                  </div>
                </div>
              </button>
            )}

            {!recipient && (
              <div className="space-y-2">
                {usersLoading && (
                  <div className="text-sm text-[var(--color-muted-foreground)]">Loading users…</div>
                )}
                {!usersLoading && availableRecipients.length === 0 && (
                  <div className="text-sm text-[var(--color-muted-foreground)]">No users found.</div>
                )}
                {!usersLoading && availableRecipients.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setManualRecipient(u)
                      setIgnorePrefill(true)
                    }}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-3 text-left hover:bg-[var(--color-secondary)]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={u.display_name} color={u.color} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{u.display_name}</div>
                        <div className="truncate text-xs text-[var(--color-muted-foreground)]">{u.handle}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Amount
            </div>
            <MoneyInput value={amountCents} onChange={setAmountCents} currency={currency} />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Note (optional)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={120}
                placeholder="What is this payment for?"
              />
            </div>
          </div>

          <Button size="xl" className="w-full" onClick={handleContinue} disabled={!canContinue}>
            Continue
          </Button>
        </section>
      )}

      {step === 'confirm' && recipient && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h1 className="text-lg font-semibold">Confirm payment</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Send {formatMoney(amountCents, currency)} to {recipient.display_name}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-muted-foreground)]">Recipient</span>
              <span className="text-sm font-medium">{recipient.display_name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-muted-foreground)]">Amount</span>
              <span className="text-sm font-semibold tabular-nums">{formatMoney(amountCents, currency)}</span>
            </div>
            {note.trim() && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-muted-foreground)]">Note</span>
                <span className="text-sm font-medium">{note.trim()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setStep('form')}>Back</Button>
            <Button onClick={handleSend} disabled={!canSend}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </section>
      )}

      {step === 'processing' && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold">Processing payment</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">Please wait a moment…</p>
          </div>
        </section>
      )}

      {step === 'success' && recipient && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" />
            <h2 className="text-lg font-semibold">Payment successful</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sent {formatMoney(amountCents, currency)} to {recipient.display_name}.
            </p>

            <div className="grid w-full max-w-sm grid-cols-1 gap-2 pt-2">
              <Button onClick={() => navigate('/activity')}>View activity</Button>
              <Button variant="outline" onClick={handleMakeAnother}>Make another payment</Button>
              {lastPayment?.group_id && (
                <Button variant="ghost" onClick={() => navigate(`/groups/${lastPayment.group_id}`)}>
                  Open group
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
