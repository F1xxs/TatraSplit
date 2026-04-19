import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useGroupInvites } from '@/hooks/useGroups'
import { useRespondGroupInvite } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { Loader2 } from 'lucide-react'

export function InboxSheet({ open, onOpenChange }) {
  const { data: invites = [], isLoading } = useGroupInvites()
  const respond = useRespondGroupInvite()
  const { toast } = useToast()

  const handle = async (inviteId, action) => {
    try {
      await respond.mutateAsync({ inviteId, action })
      toast({ variant: 'success', title: action === 'accept' ? 'Joined group!' : 'Invitation declined' })
    } catch {
      toast({ variant: 'error', title: 'Something went wrong' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
      <SheetHeader>
        <SheetTitle>Inbox</SheetTitle>
      </SheetHeader>
      <SheetContent className="space-y-3 min-h-[120px]">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted-foreground)]" />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6">No pending invitations</p>
        ) : (
          invites.map((invite) => {
            const group = invite.group
            const inviter = invite.invited_by_user
            return (
              <div key={invite.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3">
                <div className="text-2xl">{group?.emoji || '👥'}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{group?.name || 'Group'}</div>
                  {inviter && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Avatar name={inviter.display_name} color={inviter.color} size="xs" />
                      <span className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {inviter.display_name} invited you
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={respond.isPending}
                    onClick={() => handle(invite.id, 'decline')}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={respond.isPending}
                    onClick={() => handle(invite.id, 'accept')}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </SheetContent>
    </Sheet>
  )
}
