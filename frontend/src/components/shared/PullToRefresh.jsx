import { useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateGlobal } from '@/lib/invalidation'

const THRESHOLD = 72
const MAX_PULL = 120

export function PullToRefresh({ children }) {
  const qc = useQueryClient()
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const pulling = useRef(false)

  const onTouchStart = useCallback((e) => {
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null) return
    const delta = e.touches[0].clientY - startY.current
    if (delta <= 0) {
      setPullY(0)
      return
    }
    // resistance curve
    const capped = Math.min(delta * 0.5, MAX_PULL)
    setPullY(capped)
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    startY.current = null

    if (pullY >= THRESHOLD) {
      setPullY(THRESHOLD)
      setRefreshing(true)
      await invalidateGlobal(qc)
      setRefreshing(false)
    }
    setPullY(0)
  }, [pullY, qc])

  const progress = Math.min(pullY / THRESHOLD, 1)
  const showIndicator = pullY > 8 || refreshing

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {showIndicator && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-[var(--color-card)] shadow-md border border-[var(--color-border)] transition-all"
          style={{
            top: Math.max(pullY - 36, 4),
            width: 32,
            height: 32,
            opacity: refreshing ? 1 : progress,
          }}
        >
          <Loader2
            className="h-4 w-4 text-[var(--color-primary)]"
            style={{
              transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
              animation: refreshing ? undefined : 'none',
            }}
            {...(refreshing ? {} : { 'data-no-spin': true })}
          />
        </div>
      )}
      <div style={{ transform: pullY > 0 ? `translateY(${pullY}px)` : undefined, transition: pullY === 0 ? 'transform 0.2s ease' : undefined }}>
        {children}
      </div>
    </div>
  )
}
