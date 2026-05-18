import { useState } from 'react'
import { Copy, Check, Share2, UserMinus, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DataState } from '@/components/shared/DataState'
import { useContacts } from '@/hooks/useContacts'
import { useAddContact, useRemoveContact } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { api } from '@/lib/api'

export function ContactsPage() {
  const { data: contacts = [], isLoading, error, refetch } = useContacts()
  const addContact = useAddContact()
  const removeContact = useRemoveContact()
  const { toast } = useToast()

  const [handle, setHandle] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [copied, setCopied] = useState(false)

  const onAdd = async (e) => {
    e.preventDefault()
    const trimmed = handle.trim()
    if (!trimmed) return
    try {
      await addContact.mutateAsync(trimmed)
      toast({ variant: 'success', title: `${trimmed} added` })
      setHandle('')
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

  const openShare = async () => {
    try {
      const data = (await api.get('/contacts/share')).data
      setShareData(data)
      setShareOpen(true)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not load share info', description: err.message })
    }
  }

  const copyHandle = async () => {
    if (!shareData?.handle) return
    try {
      await navigator.clipboard.writeText(shareData.share_text || shareData.handle)
      setCopied(true)
      toast({ variant: 'success', title: 'Copied!' })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({ variant: 'error', title: 'Copy failed' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
        <Button size="sm" variant="outline" onClick={openShare}>
          <Share2 className="h-3.5 w-3.5" />
          Share my handle
        </Button>
      </div>

      <form onSubmit={onAdd} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
        <div className="text-sm font-medium">Add contact</div>
        <div className="flex gap-2">
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle"
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!handle.trim() || addContact.isPending}>
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-medium">
          Your contacts
        </div>
        <DataState
          loading={isLoading}
          error={error}
          empty={contacts.length === 0}
          emptyMessage="No contacts yet. Add someone by their handle."
          onRetry={refetch}
          loadingRows={4}
        >
          <div>
            {contacts.map((c, i) => (
              <div key={c.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={c.user?.display_name} color={c.user?.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.user?.display_name || 'Unknown'}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)] truncate">{c.user?.handle}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemove(c.id)}
                    disabled={removeContact.isPending}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DataState>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your handle</DialogTitle>
            <DialogDescription>
              Send this to someone so they can add you as a contact.
            </DialogDescription>
          </DialogHeader>
          {shareData && (
            <div className="space-y-3 mt-2">
              <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                <p className="text-sm pr-10 break-all">{shareData.share_text || shareData.handle}</p>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={copyHandle}
                  className="absolute right-2 top-2"
                  aria-label="Copy"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Your handle: <strong>{shareData.handle}</strong>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
