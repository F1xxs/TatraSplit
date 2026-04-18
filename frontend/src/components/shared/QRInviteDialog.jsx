import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Share2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'

export function QRInviteDialog({ open, onOpenChange, group, invite }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const token = invite?.invite_token || group?.invite_token || ''
  const url = token ? `${window.location.origin}/join/${token}` : ''

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ variant: 'success', title: 'Link copied' })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({ variant: 'error', title: 'Copy failed' })
    }
  }

  const share = async () => {
    if (!navigator.share || !url) return copy()
    try {
      await navigator.share({
        title: `Join "${group?.name}" on TatraSplit`,
        url,
      })
    } catch {
      /* cancelled */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange?.(false)} className="text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Invite to {group?.name}</DialogTitle>
          <DialogDescription className="text-center">
            Scan the code or share the link to add people.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto mt-2 flex w-full max-w-[15rem] items-center justify-center rounded-2xl bg-white p-4">
          {url ? (
            <QRCodeSVG
              value={url}
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
            value={url}
            className="h-8 w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis bg-transparent pl-2 pr-0 text-sm outline-none"
          />
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={copy}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
            aria-label="Copy invite link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-3 flex justify-center">
          <Button size="sm" variant="ghost" onClick={share}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
