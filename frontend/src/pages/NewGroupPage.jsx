import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useMe } from '@/hooks/useMe'
import { useUsers } from '@/hooks/useGroups'
import { useCreateGroup } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

const EMOJIS = ['🏠', '⛰️', '🏖️', '🍕', '🎉', '🚗', '✈️', '🎬', '☕', '🛒']
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CZK']

export function NewGroupPage() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const { data: users = [] } = useUsers()
  const createGroup = useCreateGroup()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [currency, setCurrency] = useState('EUR')
  const [selected, setSelected] = useState(new Set())

  const myId = me?.id || me?._id
  const others = users.filter((u) => (u.id || u._id) !== myId)

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
        emoji,
        currency,
        member_handles: Array.from(selected),
      })
      toast({ variant: 'success', title: 'Group created' })
      navigate(`/groups/${group.id || group._id}`)
    } catch (err) {
      toast({ variant: 'error', title: 'Could not create group', description: err.message })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Groups
      </Link>

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

          <div>
            <Label>Members</Label>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              You're automatically added. Pick who else is in.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {others.map((u) => {
                const active = selected.has(u.handle)
                return (
                  <button
                    key={u.handle}
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
                      <div className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {u.handle}
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
                  </button>
                )
              })}
              {others.length === 0 && (
                <div className="col-span-full text-sm text-[var(--color-muted-foreground)] py-4 text-center">
                  No other users to add.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link to="/groups">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button onClick={submit} disabled={!canSubmit || createGroup.isPending}>
          {createGroup.isPending ? 'Creating…' : 'Create group'}
        </Button>
      </div>
    </div>
  )
}
