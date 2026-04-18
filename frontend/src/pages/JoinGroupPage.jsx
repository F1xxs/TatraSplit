import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useJoinGroup } from '@/hooks/useMutations'
import { useToast } from '@/components/ui/toaster'

export function JoinGroupPage() {
  const { token } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const join = useJoinGroup()
  const { toast } = useToast()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    ;(async () => {
      try {
        const res = await join.mutateAsync({
          token,
          as: params.get('as') || undefined,
        })
        toast({
          variant: 'success',
          title: `Joined ${res?.name || 'group'}`,
        })
        navigate(`/groups/${res.id || res._id}`, { replace: true })
      } catch (err) {
        toast({ variant: 'error', title: 'Could not join', description: err.message })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card elevated>
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-2xl">
            🔗
          </div>
          <div className="mt-4 font-semibold">Joining group…</div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            One sec, we're connecting you.
          </p>
          <div className="mt-6">
            <Skeleton className="h-2 w-40 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
