import { useState } from 'react'
import { Database, RefreshCw, RotateCcw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { invalidateGlobal } from '@/lib/invalidation'
import { useToast } from '@/components/ui/toaster'

export function AdminPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [loadingSeed, setLoadingSeed] = useState(false)

  const loadStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await api.get('/admin/status')
      setStatus(res.data?.collections || {})
    } catch (err) {
      toast({ variant: 'error', title: 'Could not load status', description: err.message })
    } finally {
      setLoadingStatus(false)
    }
  }

  const doReset = async () => {
    setLoadingReset(true)
    try {
      await api.post('/admin/reset')
      invalidateGlobal(qc)
      await loadStatus()
      toast({ variant: 'success', title: 'Database reset complete' })
    } catch (err) {
      toast({ variant: 'error', title: 'Reset failed', description: err.message })
    } finally {
      setLoadingReset(false)
    }
  }

  const doSeed = async () => {
    setLoadingSeed(true)
    try {
      await api.post('/admin/seed')
      invalidateGlobal(qc)
      await loadStatus()
      toast({ variant: 'success', title: 'Seed completed' })
    } catch (err) {
      toast({ variant: 'error', title: 'Seed failed', description: err.message })
    } finally {
      setLoadingSeed(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Admin: Database</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">Reset, seed and inspect demo data state</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Use with care during live demo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={doReset} disabled={loadingReset || loadingSeed}>
            <RotateCcw className="h-4 w-4" />
            {loadingReset ? 'Resetting...' : 'Reset & Reseed'}
          </Button>
          <Button variant="secondary" onClick={doSeed} disabled={loadingSeed || loadingReset}>
            <RefreshCw className="h-4 w-4" />
            {loadingSeed ? 'Populating...' : 'Populate'}
          </Button>
          <Button variant="outline" onClick={loadStatus} disabled={loadingStatus}>
            <Database className="h-4 w-4" />
            {loadingStatus ? 'Loading...' : 'Status'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collection Status</CardTitle>
          <CardDescription>Document counts by collection.</CardDescription>
        </CardHeader>
        <CardContent>
          {!status ? (
            <div className="text-sm text-[var(--color-muted-foreground)]">Click Status to load current counts.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-card-elevated)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Collection</th>
                    <th className="px-3 py-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(status).map(([name, count]) => (
                    <tr key={name} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2">{name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
