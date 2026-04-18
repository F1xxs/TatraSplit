export function formatMoney(cents, currency = 'EUR', { sign = false } = {}) {
  const amount = (cents ?? 0) / 100
  const abs = Math.abs(amount)
  const nf = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const str = nf.format(abs)
  if (!sign) return (amount < 0 ? '-' : '') + str
  if (amount === 0) return str
  return (amount > 0 ? '+' : '-') + str
}

export const CATEGORIES = [
  { id: 'food',          label: 'Food',          emoji: '🍔', color: 'var(--color-chart-1)' },
  { id: 'rent',          label: 'Rent',          emoji: '🏠', color: 'var(--color-chart-2)' },
  { id: 'transport',     label: 'Transport',     emoji: '🚗', color: 'var(--color-chart-3)' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', color: 'var(--color-chart-4)' },
  { id: 'utilities',     label: 'Utilities',     emoji: '💡', color: 'var(--color-chart-5)' },
  { id: 'groceries',     label: 'Groceries',     emoji: '🛒', color: 'var(--color-chart-6)' },
  { id: 'other',         label: 'Other',         emoji: '✨', color: 'hsl(240 5% 55%)' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other
}

export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function colorForName(name) {
  const palette = [
    'hsl(210 90% 62%)',
    'hsl(199 89% 65%)',
    'hsl(142 72% 55%)',
    'hsl(38 92% 60%)',
    'hsl(340 82% 65%)',
    'hsl(173 70% 55%)',
    'hsl(27 92% 62%)',
  ]
  let h = 0
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return palette[Math.abs(h) % palette.length]
}
