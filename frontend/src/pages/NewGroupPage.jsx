import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Check, Search, UserPlus, BookUser } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useMe } from '@/hooks/useMe'
import { useCreateGroup } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { useAddContact, useContacts, useUserSearch } from '@/hooks/useContacts'

const EMOJIS = ['🏠', '⛰️', '🏖️', '🍕', '🎉', '🚗', '✈️', '🎬', '☕', '🛒']
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CZK']

export function NewGroupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const draft = location.state?.newGroupDraft
  const { data: me } = useMe()
  const { data: contacts = [] } = useContacts()
  const createGroup = useCreateGroup()
  const addContact = useAddContact()
  const { toast } = useToast()

  const [name, setName] = useState(draft?.name || '')
  const [emoji, setEmoji] = useState(draft?.emoji || '🏠')
  const [currency, setCurrency] = useState(draft?.currency || 'EUR')
  const [selected, setSelected] = useState(new Set(draft?.selectedHandles || []))
  const [search, setSearch] = useState(draft?.search || '')
  const [busyUserId, setBusyUserId] = useState(null)
  const [jarMode, setJarMode] = useState(Boolean(draft?.jarMode))

  const { data: searchResults = [], isLoading: searching } = useUserSearch(search)

  const myId = me?.id
  const contactUsers = contacts
    .map((c) => c.user)
    .filter((u) => u && u.id !== myId)
  const contactById = new Map(contactUsers.map((u) => [u.id, u]))

  const toggle = (handle) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(handle)) n.delete(handle)
      else n.add(handle)
      return n
    })
  }

  const canSubmit = name.trim().length > 0

  const submit = async () => {
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        emoji: jarMode ? '📦' : emoji,
        currency,
        member_handles: Array.from(selected),
        jar_mode: jarMode,
      })
      const inviteCount = selected.size
      toast({
        variant: 'success',
        title: inviteCount > 0 ? `Group created, ${inviteCount} invite${inviteCount === 1 ? '' : 's'} sent` : 'Group created',
      })
      navigate(`/groups/${group.id}`)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not create group', description: err.message })
    }
  }

  const addAsContactAndSelect = async (user) => {
    setBusyUserId(user.id)
    try {
      await addContact.mutateAsync({ user_id: user.id })
      toggle(user.handle)
      toast({ variant: 'success', title: `${user.display_name} added to contacts and invite list` })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add contact', description: err.message })
    } finally {
      setBusyUserId(null)
    }
  }

  const visibleSearch = searchResults.filter((u) => u.id !== myId)

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/groups')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card elevated>
        <CardHeader>
          <CardTitle>New group</CardTitle>
          <CardDescription>
            Start splitting with friends, family, or roommates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-2"
              placeholder="Roommates, Trip to Tatras…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Icon</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'h-11 w-11 rounded-xl text-2xl transition-all flex items-center justify-center border',
                    emoji === e
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 scale-105'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-secondary)]',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Currency</Label>
            <div className="mt-2 flex gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm border transition-all',
                    currency === c
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15'
                      : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Moneybox mode */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>Moneybox</Label>
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                  Members contribute to a shared pot. No debt — dissolution returns money proportional to contributions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setJarMode((v) => !v)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
                  jarMode ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-secondary)]',
                )}
                role="switch"
                aria-checked={jarMode}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                    jarMode ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>My contacts</Label>
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                  Use contacts for quick member selection.
                </p>
              </div>
              <Link
                to="/contacts"
                state={{
                  from: '/groups/new',
                  backLabel: 'New group',
                  returnState: {
                    newGroupDraft: {
                      name,
                      emoji,
                      currency,
                      selectedHandles: Array.from(selected),
                      search,
                      jarMode,
                    },
                  },
                }}
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <BookUser className="h-3.5 w-3.5" />
                  See contacts
                </Button>
              </Link>
            </div>

            {contactUsers.length === 0 ? (
              <div className="text-xs text-[var(--color-muted-foreground)]">
                No saved contacts yet. Search below and add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contactUsers.map((u) => {
                  const active = selected.has(u.handle)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggle(u.handle)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all',
                        active
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-secondary)]',
                      )}
                    >
                      <Avatar name={u.display_name} color={u.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.display_name}</div>
                        <div className="text-xs text-[var(--color-muted-foreground)] truncate">{u.handle}</div>
                      </div>
                      {active && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <Label htmlFor="member-search">Find and add member</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                id="member-search"
                placeholder="Search by handle or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {search.trim().length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] overflow-hidden">
                {searching ? (
                  <div className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">Searching…</div>
                ) : visibleSearch.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">No users found.</div>
                ) : (
                  visibleSearch.map((u, i) => {
                    const selectedNow = selected.has(u.handle)
                    const isContact = contactById.has(u.id)
                    return (
                      <div key={u.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Avatar name={u.display_name} color={u.color} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{u.display_name}</div>
                            <div className="text-xs text-[var(--color-muted-foreground)] truncate">{u.handle}</div>
                          </div>
                          {selectedNow ? (
                            <Button size="sm" variant="secondary" disabled>
                              Added
                            </Button>
                          ) : isContact ? (
                            <Button size="sm" onClick={() => toggle(u.handle)}>
                              Invite to group
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addAsContactAndSelect(u)}
                              disabled={busyUserId === u.id}
                              className="gap-1.5"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add contact + invite
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={goBack}>Cancel</Button>
        <Button onClick={submit} disabled={!canSubmit || createGroup.isPending}>
          {createGroup.isPending ? 'Creating…' : 'Create group'}
        </Button>
      </div>
    </div>
  )
}
