import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, MoreHorizontal, Receipt, Repeat, RotateCcw, Search, Send, Share2, SplitSquareHorizontal } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { SplitEditor } from '@/components/shared/SplitEditor'
import { useMe } from '@/hooks/useMe'
import { useGroups, useUsers } from '@/hooks/useGroups'
import { usePayment, usePaymentExpense } from '@/hooks/useMutations'
import { formatMoney, CATEGORIES } from '@/lib/format'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { distributeEqualSplit, getCustomSplitBudgetStatus, isSplitReady, resolveSplitPayload } from '@/lib/split'

function genTxRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: me } = useMe()
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const { data: groups = [] } = useGroups()
  const payment = usePayment()
  const paymentExpense = usePaymentExpense()
  const { toast } = useToast()

  // ── Send-mode prefill (from SettleUpPage "Pay in app") ──────────────────
  const prefillHandle = searchParams.get('to') || ''
  const prefillUserId = searchParams.get('toUser') || ''
  const prefillAmountRaw = Number.parseInt(searchParams.get('amount') || '0', 10)
  const prefillAmount = Number.isInteger(prefillAmountRaw) && prefillAmountRaw > 0 ? prefillAmountRaw : 0
  const prefillGroupId = searchParams.get('groupId') || ''
  const hasSettlePrefill = !!(prefillUserId && prefillAmount)

  // ── Mode ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState(
    hasSettlePrefill ? 'send' : (searchParams.get('mode') || 'send')
  )

  // ── Shared state ────────────────────────────────────────────────────────
  const [step, setStep] = useState('form')
  const [amountCents, setAmountCents] = useState(prefillAmount)
  const [lastResult, setLastResult] = useState(null)

  // ── Send mode state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [manualRecipient, setManualRecipient] = useState(null)
  const [ignorePrefill, setIgnorePrefill] = useState(false)

  // ── Split mode state ─────────────────────────────────────────────────────
  const [selectedGroupId, setSelectedGroupId] = useState(
    searchParams.get('mode') === 'split' ? prefillGroupId : ''
  )
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [splitType, setSplitType] = useState('equal')
  const [split, setSplit] = useState([])

  const currency = me?.currency || 'EUR'
  const meId = me?.id

  // ── Derived: send mode ───────────────────────────────────────────────────
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
    const found = users.find((u) => {
      if (prefillUserId && u.id === prefillUserId) return true
      return prefillHandle && u.handle?.toLowerCase() === prefillHandle.toLowerCase()
    })
    if (found?.id === meId) return null
    return found || null
  }, [users, prefillHandle, prefillUserId, meId])

  const recipient = manualRecipient || (!ignorePrefill ? prefilledRecipient : null)
  const isSelfRecipient = recipient && recipient.id === meId
  const sendCanContinue = !!recipient && amountCents > 0 && !isSelfRecipient
  const sendCanSend = sendCanContinue && !payment.isPending

  // ── Derived: split mode ──────────────────────────────────────────────────
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  )

  // Members for split: from group or manually selected participants (always include me)
  const splitMembers = useMemo(() => {
    if (selectedGroup) return selectedGroup.members || []
    if (!me) return selectedParticipants
    const hasMe = selectedParticipants.some((p) => p.id === meId)
    if (hasMe) return selectedParticipants
    return me ? [{ id: me.id, display_name: me.display_name, handle: me.handle, color: me.color }, ...selectedParticipants] : selectedParticipants
  }, [selectedGroup, selectedParticipants, me, meId])

  const availableParticipants = useMemo(() => {
    const term = participantSearch.trim().toLowerCase()
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
  }, [users, meId, participantSearch])

  const splitCanContinue = useMemo(() => {
    if (amountCents <= 0) return false
    if (!description.trim()) return false
    if (!me?.id) return false
    if (splitMembers.length < 2) return false
    if (!isSplitReady({ splitType, split, amountCents })) return false
    return true
  }, [amountCents, description, me, splitMembers, split, splitType])
  const splitBudgetStatus = useMemo(
    () => getCustomSplitBudgetStatus({ splitType, split, amountCents }),
    [splitType, split, amountCents],
  )
  const splitGuidance = useMemo(() => {
    if (mode !== 'split' || splitType !== 'custom' || splitMembers.length < 2 || amountCents <= 0) return null
    const activeCurrency = selectedGroup?.currency || currency
    if (splitBudgetStatus.state === 'exact') {
      return {
        tone: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
        text: 'Split is exact. Ready to continue.',
      }
    }
    if (splitBudgetStatus.state === 'under') {
      return {
        tone: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
        text: `${formatMoney(splitBudgetStatus.remainderCents, activeCurrency)} left to assign before continuing.`,
      }
    }
    return {
      tone: 'text-[var(--color-destructive)] bg-[var(--color-destructive)]/10',
      text: `${formatMoney(splitBudgetStatus.remainderCents, activeCurrency)} over budget. Reduce shares to continue.`,
    }
  }, [mode, splitType, splitMembers.length, amountCents, splitBudgetStatus, selectedGroup?.currency, currency])

  // Auto-update split when members/amount changes in equal mode
  useEffect(() => {
    if (mode === 'split' && splitType === 'equal' && splitMembers.length > 0 && amountCents > 0) {
      setSplit(distributeEqualSplit(amountCents, splitMembers.map((m) => m.id)))
    }
  }, [mode, splitType, amountCents, splitMembers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers: send mode ──────────────────────────────────────────────────
  function handleSendContinue() {
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
    if (!recipient || !meId || !sendCanSend) return
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
        group_id: prefillGroupId || undefined,
      })
      const elapsed = Date.now() - startedAt
      if (elapsed < 1200) await new Promise((r) => setTimeout(r, 1200 - elapsed))
      navigate('/activity/receipt', {
        state: {
          from_name: me.display_name,
          to_name: recipient.display_name,
          from_user: meId,
          to_user: recipient.id,
          amount_cents: amountCents,
          currency,
          note: note.trim(),
          settlement_id: result.settlement?.id,
          group_id: result.group_id,
          created_at: new Date().toISOString(),
        },
      })
    } catch (error) {
      setStep('confirm')
      toast({ variant: 'error', title: 'Payment failed', description: error?.message || 'Could not process payment.' })
    }
  }

  // ── Handlers: split mode ─────────────────────────────────────────────────
  function handleSplitContinue() {
    if (amountCents <= 0) {
      toast({ variant: 'error', title: 'Enter amount', description: 'Amount must be greater than zero.' })
      return
    }
    if (!description.trim()) {
      toast({ variant: 'error', title: 'Enter description', description: 'Describe what this expense is for.' })
      return
    }
    if (splitMembers.length < 2) {
      toast({ variant: 'error', title: 'Add participants', description: 'Select at least one other person to split with.' })
      return
    }
    if (splitType === 'custom' && splitBudgetStatus.state !== 'exact') {
      const activeCurrency = selectedGroup?.currency || currency
      const msg = splitBudgetStatus.state === 'under'
        ? `${formatMoney(splitBudgetStatus.remainderCents, activeCurrency)} is still unassigned.`
        : `${formatMoney(splitBudgetStatus.remainderCents, activeCurrency)} is over budget.`
      toast({ variant: 'error', title: 'Fix split first', description: msg })
      return
    }
    setStep('confirm')
  }

  async function handleSplitSend() {
    if (!me?.id || !splitCanContinue) return
    setStep('processing')
    const startedAt = Date.now()
    try {
      const splitPayload = resolveSplitPayload({
        splitType,
        split,
        allMemberIds: splitMembers.map((m) => m.id),
      })
      const result = await paymentExpense.mutateAsync({
        group_id: selectedGroupId || undefined,
        participant_handles: selectedGroup
          ? undefined
          : selectedParticipants.map((p) => p.handle).filter(Boolean),
        amount_cents: amountCents,
        currency: selectedGroup?.currency || currency,
        description: description.trim(),
        category,
        ...splitPayload,
        paid_by: me.id,
      })
      const elapsed = Date.now() - startedAt
      if (elapsed < 1200) await new Promise((r) => setTimeout(r, 1200 - elapsed))
      setLastResult(result)
      setTxRef(genTxRef())
      setStep('success')
    } catch (error) {
      setStep('confirm')
      toast({ variant: 'error', title: 'Could not create expense', description: error?.message || 'Something went wrong.' })
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  function handleMakeAnother() {
    setStep('form')
    setAmountCents(0)
    setNote('')
    setManualRecipient(null)
    setIgnorePrefill(true)
    setSearch('')
    setLastResult(null)
    setSelectedGroupId('')
    setSelectedParticipants([])
    setParticipantSearch('')
    setDescription('')
    setCategory('other')
    setSplitType('equal')
    setSplit([])
  }

  const resultGroupId = lastResult?.group_id

  const [txRef, setTxRef] = useState('')

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-(--color-foreground)"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* ── FORM step ──────────────────────────────────────────────────────── */}
      {step === 'form' && (
        <section className="space-y-4">
          {/* Mode toggle */}
          {!hasSettlePrefill && (
            <PaymentModeToggle mode={mode} onChange={(m) => { setMode(m); setStep('form') }} />
          )}

          {mode === 'send' ? (
            /* ── Send mode form ── */
            <>
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
                {recipient ? (
                  <button
                    onClick={() => { setManualRecipient(null); setIgnorePrefill(true) }}
                    className="w-full rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-3 text-left"
                  >
                    <UserRow user={recipient} />
                  </button>
                ) : (
                  <div className="space-y-2">
                    {usersLoading && <div className="text-sm text-[var(--color-muted-foreground)]">Loading users…</div>}
                    {!usersLoading && availableRecipients.length === 0 && (
                      <div className="text-sm text-[var(--color-muted-foreground)]">No users found.</div>
                    )}
                    {!usersLoading && availableRecipients.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setManualRecipient(u); setIgnorePrefill(true) }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-3 text-left hover:bg-[var(--color-secondary)]"
                      >
                        <UserRow user={u} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Amount</div>
                <MoneyInput value={amountCents} onChange={setAmountCents} currency={currency} />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Note (optional)
                  </label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="What is this payment for?" />
                </div>
              </div>

              <Button size="xl" className="w-full" onClick={handleSendContinue} disabled={!sendCanContinue}>
                Continue
              </Button>
            </>
          ) : (
            /* ── Split mode form ── */
            <>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <h1 className="text-lg font-semibold">Split payment</h1>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Create a shared expense and split it with others.
                </p>
              </div>

              {/* Amount */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Amount</div>
                <MoneyInput value={amountCents} onChange={setAmountCents} currency={selectedGroup?.currency || currency} />
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Description</div>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner at Taverna"
                  maxLength={120}
                />
              </div>

              {/* Category */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Category</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-all',
                        category === c.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-foreground)]'
                          : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                      )}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group selector */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Group (optional)</div>
                <GroupSelector
                  groups={groups}
                  selectedId={selectedGroupId}
                  onSelect={(id) => {
                    setSelectedGroupId(id)
                    setSelectedParticipants([])
                    setSplit([])
                  }}
                />
              </div>

              {/* Participant picker — only when no group selected */}
              {!selectedGroupId && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Participants
                  </div>
                  {me && (
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 px-3 py-2">
                      <Avatar name={me.display_name} color={me.color} size="sm" />
                      <span className="text-sm font-medium flex-1">{me.display_name}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">you</span>
                    </div>
                  )}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <Input
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      placeholder="Add people by name or handle"
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    {usersLoading && <div className="text-sm text-[var(--color-muted-foreground)]">Loading users…</div>}
                    {!usersLoading && availableParticipants.map((u) => {
                      const selected = selectedParticipants.some((p) => p.id === u.id)
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedParticipants((prev) =>
                              selected ? prev.filter((p) => p.id !== u.id) : [...prev, u]
                            )
                            setSplit([])
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                            selected
                              ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10'
                              : 'border-[var(--color-border)] bg-[var(--color-card-elevated)] hover:bg-[var(--color-secondary)]',
                          )}
                        >
                          <Avatar name={u.display_name} color={u.color} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{u.display_name}</div>
                            <div className="text-xs text-[var(--color-muted-foreground)]">{u.handle}</div>
                          </div>
                          {selected && <Check className="h-4 w-4 text-[var(--color-primary)] shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Split editor — show when we have members and an amount */}
              {splitMembers.length >= 2 && amountCents > 0 && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Split</div>
                  <SplitEditor
                    members={splitMembers}
                    amountCents={amountCents}
                    currency={selectedGroup?.currency || currency}
                    splitType={splitType}
                    onSplitTypeChange={(t) => { setSplitType(t); setSplit([]) }}
                    split={split}
                    onSplitChange={setSplit}
                    payerId={me?.id}
                  />
                  {splitGuidance && (
                    <div className={cn('rounded-lg px-3 py-2 text-xs', splitGuidance.tone)}>
                      {splitGuidance.text}
                    </div>
                  )}
                </div>
              )}

              <Button
                size="xl"
                className="w-full"
                onClick={handleSplitContinue}
                disabled={!splitCanContinue}
              >
                {splitType === 'custom' && splitBudgetStatus.state !== 'exact'
                  ? 'Fix split to continue'
                  : 'Continue'}
              </Button>
            </>
          )}
        </section>
      )}

      {/* ── CONFIRM step ────────────────────────────────────────────────────── */}
      {step === 'confirm' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h1 className="text-lg font-semibold">
              {mode === 'send' ? 'Confirm payment' : 'Confirm expense'}
            </h1>
            {mode === 'send' && recipient && (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Send {formatMoney(amountCents, currency)} to {recipient.display_name}
              </p>
            )}
            {mode === 'split' && (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {formatMoney(amountCents, selectedGroup?.currency || currency)} · {description}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-4 space-y-3">
            {mode === 'send' && recipient && (
              <>
                <ConfirmRow label="Recipient" value={recipient.display_name} />
                <ConfirmRow label="Amount" value={formatMoney(amountCents, currency)} mono />
                {note.trim() && <ConfirmRow label="Note" value={note.trim()} />}
              </>
            )}
            {mode === 'split' && (
              <>
                <ConfirmRow label="Description" value={description} />
                <ConfirmRow label="Amount" value={formatMoney(amountCents, selectedGroup?.currency || currency)} mono />
                <ConfirmRow label="Group" value={selectedGroup?.name || 'New group'} />
                <ConfirmRow label="Split" value={`${splitMembers.length} people · ${splitType}`} />
                {split.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    {split.map((s) => {
                      const m = splitMembers.find((mb) => mb.id === s.user_id)
                      return (
                        <div key={s.user_id} className="flex items-center gap-2">
                          <Avatar name={m?.display_name} color={m?.color} size="xs" />
                          <span className="text-sm flex-1 truncate">{m?.display_name || s.user_id}</span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatMoney(s.share_cents, selectedGroup?.currency || currency)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setStep('form')}>Back</Button>
            <Button
              onClick={mode === 'send' ? handleSend : handleSplitSend}
              disabled={mode === 'send' ? !sendCanSend : !splitCanContinue}
            >
              <Send className="h-4 w-4" />
              {mode === 'send' ? 'Send' : 'Confirm'}
            </Button>
          </div>
        </section>
      )}

      {/* ── PROCESSING step ─────────────────────────────────────────────────── */}
      {step === 'processing' && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold">
              {mode === 'send' ? 'Processing payment' : 'Creating expense'}
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">Please wait a moment…</p>
          </div>
        </section>
      )}

      {/* ── SUCCESS step ────────────────────────────────────────────────────── */}
      {step === 'success' && (
        <section className="space-y-3">
          {/* Hero card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Animated checkmark */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/15 border border-[var(--color-success)]/30">
                <CheckCircle2 className="h-9 w-9 text-[var(--color-success)]" style={{ animation: 'successPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }} />
              </div>
              <style>{`@keyframes successPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

              <h2 className="text-xl font-semibold">
                {mode === 'send' ? 'Payment sent' : 'Expense added'}
              </h2>

              {/* Avatar row */}
              <div className="flex items-center gap-3">
                {mode === 'send' ? (
                  <>
                    <div className="flex flex-col items-center gap-1">
                      <Avatar name={me?.display_name} color={me?.color} size="md" />
                      <span className="text-xs text-[var(--color-muted-foreground)] max-w-[72px] truncate">{me?.display_name}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[var(--color-muted-foreground)] shrink-0" />
                    <div className="flex flex-col items-center gap-1">
                      <Avatar name={recipient?.display_name} color={recipient?.color} size="md" />
                      <span className="text-xs text-[var(--color-muted-foreground)] max-w-[72px] truncate">{recipient?.display_name}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex -space-x-2">
                      {splitMembers.slice(0, 4).map((m) => (
                        <Avatar key={m.id} name={m.display_name} color={m.color} size="md" />
                      ))}
                      {splitMembers.length > 4 && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-card-elevated)] border border-[var(--color-border)] text-xs font-semibold">
                          +{splitMembers.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      Split among {splitMembers.length} people
                    </span>
                  </div>
                )}
              </div>

              {/* Large amount */}
              <div className="text-4xl font-bold tabular-nums">
                {formatMoney(amountCents, selectedGroup?.currency || currency)}
              </div>

              {/* Subtitle */}
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {mode === 'send' && recipient
                  ? `To: ${recipient.display_name} · Today ${new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                  : `Split among ${splitMembers.length} people · Today ${new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>

          {/* Quick action row */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4">
            <div className="flex items-start justify-around gap-1">
              {/* Share */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toast({ title: 'Share', description: 'Sharing not available in demo.' })}
                  className="w-14 h-14 rounded-full bg-[var(--color-card-elevated)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors"
                >
                  <Share2 className="h-5 w-5 text-[var(--color-foreground)]" />
                </button>
                <span className="text-xs text-[var(--color-muted-foreground)]">Share</span>
              </div>
              {/* Again */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleMakeAnother}
                  className="w-14 h-14 rounded-full bg-[var(--color-card-elevated)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors"
                >
                  <RotateCcw className="h-5 w-5 text-[var(--color-foreground)]" />
                </button>
                <span className="text-xs text-[var(--color-muted-foreground)]">Again</span>
              </div>
              {/* Check */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/activity')}
                  className="w-14 h-14 rounded-full bg-[var(--color-card-elevated)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors"
                >
                  <Receipt className="h-5 w-5 text-[var(--color-foreground)]" />
                </button>
                <span className="text-xs text-[var(--color-muted-foreground)]">Check</span>
              </div>
              {/* Recurring */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (resultGroupId) navigate(`/groups/${resultGroupId}`)
                    else toast({ title: 'Recurring', description: 'Associate this expense with a group to set up recurring payments.' })
                  }}
                  className="w-14 h-14 rounded-full bg-[var(--color-card-elevated)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors"
                >
                  <Repeat className="h-5 w-5 text-[var(--color-foreground)]" />
                </button>
                <span className="text-xs text-[var(--color-muted-foreground)]">Recurring</span>
              </div>
              {/* More */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toast({ title: 'More options', description: 'More options coming soon.' })}
                  className="w-14 h-14 rounded-full bg-[var(--color-card-elevated)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5 text-[var(--color-foreground)]" />
                </button>
                <span className="text-xs text-[var(--color-muted-foreground)]">More</span>
              </div>
            </div>
          </div>

          {/* Transaction details card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Transaction details
            </div>
            <ConfirmRow label="Reference" value={`REF-${txRef}`} mono />
            <ConfirmRow label="Status" value="Completed" />
            <ConfirmRow
              label="Date"
              value={new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            />
            {mode === 'send' && note.trim() && (
              <ConfirmRow label="Note" value={note.trim()} />
            )}
            {mode === 'split' && (
              <ConfirmRow
                label="Category"
                value={CATEGORIES.find((c) => c.id === category)?.label || category}
              />
            )}
          </div>

          {/* Primary actions */}
          <div className="grid gap-2">
            <Button onClick={() => navigate('/activity')}>View activity</Button>
            {resultGroupId && (
              <Button variant="outline" onClick={() => navigate(`/groups/${resultGroupId}`)}>
                Open group
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Local sub-components ───────────────────────────────────────────────────

function PaymentModeToggle({ mode, onChange }) {
  return (
    <div className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] p-1 gap-1">
      <button
        onClick={() => onChange('send')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          mode === 'send'
            ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
            : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        )}
      >
        <Send className="h-4 w-4" />
        Send money
      </button>
      <button
        onClick={() => onChange('split')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          mode === 'split'
            ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
            : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        )}
      >
        <SplitSquareHorizontal className="h-4 w-4" />
        Split payment
      </button>
    </div>
  )
}

function GroupSelector({ groups, selectedId, onSelect }) {
  return (
    <div className="space-y-1.5">
      <button
        onClick={() => onSelect('')}
        className={cn(
          'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
          !selectedId
            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-foreground)]'
            : 'border-[var(--color-border)] bg-[var(--color-card-elevated)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        )}
      >
        <span className="text-lg">👥</span>
        <span className="flex-1">No group (standalone)</span>
        {!selectedId && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
      </button>
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
            selectedId === g.id
              ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-foreground)]'
              : 'border-[var(--color-border)] bg-[var(--color-card-elevated)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          )}
        >
          <span className="text-lg">{g.emoji || '👥'}</span>
          <span className="flex-1 truncate font-medium">{g.name}</span>
          {selectedId === g.id && <Check className="h-4 w-4 text-[var(--color-primary)] shrink-0" />}
        </button>
      ))}
    </div>
  )
}

function UserRow({ user }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={user.display_name} color={user.color} size="sm" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{user.display_name}</div>
        <div className="truncate text-xs text-[var(--color-muted-foreground)]">{user.handle}</div>
      </div>
    </div>
  )
}

function ConfirmRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
      <span className={cn('text-sm font-medium', mono && 'font-semibold tabular-nums')}>{value}</span>
    </div>
  )
}
