import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatMoney, getCategory } from '@/lib/format'

export function SplitDonut({ splits = [], totalCents, category, description, currency = 'EUR' }) {
  if (!splits.length) return null

  const chartData = splits.map((s) => ({
    name: s.display_name || s.user_id,
    value: s.share_cents || 0,
    color: s.color || '#0070D2',
  }))

  const cat = getCategory(category)
  const size = 220

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={size * 0.3}
              outerRadius={size * 0.44}
              stroke="none"
              paddingAngle={3}
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-3xl">{cat.emoji}</span>
          <div className="text-xs text-[var(--color-muted-foreground)] text-center px-4 leading-tight truncate max-w-[120px]">
            {description}
          </div>
          <div className="text-base font-bold tabular-nums">
            {formatMoney(totalCents, currency)}
          </div>
        </div>

        {/* Avatar pins around ring */}
        {chartData.map((d, i) => {
          const angle = (360 / chartData.length) * i - 90
          const rad = (angle * Math.PI) / 180
          const r = size * 0.44 + 6
          const cx = size / 2 + r * Math.cos(rad)
          const cy = size / 2 + r * Math.sin(rad)
          return (
            <div
              key={i}
              className="absolute h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--color-background)]"
              style={{
                background: d.color,
                left: cx - 16,
                top: cy - 16,
              }}
            >
              {(d.name || '?')[0].toUpperCase()}
            </div>
          )
        })}
      </div>

      {/* Participant list */}
      <div className="w-full mt-2 space-y-0">
        {splits.map((s) => (
          <div
            key={s.user_id}
            className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border)] first:border-t-0"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: s.color || '#0070D2' }}
            >
              {(s.display_name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 text-sm font-medium">{s.display_name || s.user_id}</div>
            <div className="text-sm font-semibold tabular-nums">
              {formatMoney(s.share_cents || 0, currency)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
