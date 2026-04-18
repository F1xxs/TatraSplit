import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Search, UserPlus, UserMinus, Share2, Copy, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataState } from '@/components/shared/DataState'
import { useMe } from '@/hooks/useMe'
import {
  useContacts,
  useAddContact,
  useRemoveContact,
  useUserSearch,
} from '@/hooks/useContacts'
import { useToast } from '@/components/ui/toaster'

export function ContactsPage() {
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const handledInviteRef = useRef('')
  const { data: me } = useMe()
  const { toast } = useToast()
  const { data: contacts = [], isLoading, error, refetch } = useContacts()
  const { data: users = [], isLoading: searching } = useUserSearch(query)
  const addContact = useAddContact()
  const removeContact = useRemoveContact()

  const contactByUserId = new Map(contacts.map((c) => [c.contact_user_id, c]))
  const searchResults = users.filter((u) => u.id !== me?.id)
  const inviteHandle = searchParams.get('add')?.trim() || ''
  const inviteUrl = me?.handle
    ? `${window.location.origin}/contacts?add=${encodeURIComponent(me.handle)}`
    : ''

  useEffect(() => {
    if (!inviteHandle || handledInviteRef.current === inviteHandle || !me?.handle) return
    handledInviteRef.current = inviteHandle

    if (inviteHandle === me.handle) {
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
      return
    }

    ;(async () => {
      try {
        await addContact.mutateAsync({ handle: inviteHandle })
        toast({ variant: 'success', title: `Contact ${inviteHandle} added` })
      } catch (err) {
        toast({ variant: 'error', title: 'Could not add contact from link', description: err.message })
      } finally {
        const next = new URLSearchParams(searchParams)
        next.delete('add')
        setSearchParams(next, { replace: true })
      }
    })()
  }, [inviteHandle, me?.handle, addContact, searchParams, setSearchParams, toast])

  const onAdd = async (userId) => {
    try {
      await addContact.mutateAsync({ user_id: userId })
      toast({ variant: 'success', title: 'Contact added' })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not add contact', description: err.message })
    }
  }

  const onRemove = async (contactId) => {
    try {
      await removeContact.mutateAsync(contactId)
      toast({ variant: 'success', title: 'Contact removed' })
    } catch (err) {
      toast({ variant: 'error', title: 'Could not remove contact', description: err.message })
    }
  }

  const copyInvite = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast({ variant: 'success', title: 'Invite link copied' })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({ variant: 'error', title: 'Copy failed' })
    }
  }

  const shareInvite = async () => {
    if (!inviteUrl) return
    if (!navigator.share) return copyInvite()
    try {
      await navigator.share({
        title: 'Add me on TatraSplit',
        url: inviteUrl,
      })
    } catch {
      // user cancelled
    }
  }

  return (
    <div className="space-y-4">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Groups
      </Link>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
          <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
            <Share2 className="h-3.5 w-3.5" />
            Invite
          </Button>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Save people you split with often.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
        <label htmlFor="contacts-search" className="text-sm font-medium">Find users</label>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            id="contacts-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by handle or name"
            className="pl-9"
          />
        </div>
        {query.trim() && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-elevated)] overflow-hidden">
            {searching ? (
              <div className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">Searching…</div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">No users found.</div>
            ) : (
              searchResults.map((u, i) => {
                const existing = contactByUserId.get(u.id)
                return (
                  <div key={u.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar name={u.display_name} color={u.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.display_name}</div>
                        <div className="text-xs text-[var(--color-muted-foreground)] truncate">{u.handle}</div>
                      </div>
                      {existing ? (
                        <Button size="sm" variant="outline" onClick={() => onRemove(existing.id)} disabled={removeContact.isPending}>
                          <UserMinus className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => onAdd(u.id)} disabled={addContact.isPending}>
                          <UserPlus className="h-3.5 w-3.5" />
                          Add
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

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <DataState
          loading={isLoading}
          error={error}
          empty={contacts.length === 0}
          emptyMessage="No contacts yet."
          onRetry={refetch}
          loadingRows={4}
        >
          <div>
            {contacts.map((c, i) => (
              <div key={c.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={c.user?.display_name} color={c.user?.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.user?.display_name || 'Unknown user'}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)] truncate">{c.user?.handle || c.contact_user_id}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onRemove(c.id)} disabled={removeContact.isPending}>
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DataState>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent onClose={() => setInviteOpen(false)} className="text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Add me as contact</DialogTitle>
            <DialogDescription className="text-center">
              Scan the QR code or open the link to add <strong>{me?.handle || 'this user'}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="mx-auto mt-2 flex w-full max-w-[15rem] items-center justify-center rounded-2xl bg-white p-4">
            {inviteUrl ? (
              <QRCodeSVG
                value={inviteUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#0a0a0b"
                level="M"
                includeMargin={false}
                style={{ display: 'block', width: '100%', height: 'auto', maxWidth: '220px' }}
              />
            ) : null}
          </div>

          <div className="relative mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2">
            <input
              readOnly
              value={inviteUrl}
              className="h-8 w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis bg-transparent pl-2 pr-0 text-sm outline-none"
            />
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={copyInvite}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
              aria-label="Copy contact invite link"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-3 flex justify-center">
            <Button size="sm" variant="ghost" onClick={shareInvite}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
