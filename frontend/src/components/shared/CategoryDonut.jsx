import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategory, formatMoney } from '@/lib/format'

export function CategoryDonut({ data = [], currency = 'EUR', size = 180 }) {
  const total = data.reduce((sum, d) => sum + (d.spent_cents || 0), 0)
  const chartData = data.map((d) => {
    const c = getCategory(d.category)
    return {
      name: c.label,
      emoji: c.emoji,
      value: d.spent_cents,
      color: c.color,
      category: d.category,
    }
  })

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center text-[var(--color-muted-foreground)] text-sm h-[180px]">
        No spending yet
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center" style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={size * 0.32}
            outerRadius={size * 0.46}
            stroke="none"
            paddingAngle={2}
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            contentStyle={{
              background: 'var(--color-card-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--color-foreground)',
            }}
            formatter={(value, _name, p) => [
              formatMoney(value, currency),
              `${p.payload.emoji} ${p.payload.name}`,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Total
        </div>
        <div className="text-xl font-semibold tabular-nums">
          {formatMoney(total, currency)}
        </div>
      </div>
    </div>
  )
}

export function CategoryLegend({ data = [], currency = 'EUR' }) {
  if (!data.length) return null
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
      {data.map((d) => {
        const c = getCategory(d.category)
        return (
          <div key={d.category} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: c.color }}
            />
            <span className="flex-1 truncate text-[var(--color-muted-foreground)]">
              {c.emoji} {c.label}
            </span>
            <span className="tabular-nums">
              {formatMoney(d.spent_cents, currency)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
