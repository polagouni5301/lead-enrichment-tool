export function formatPercent(value) {
  return `${Math.round(value)}%`
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function normalizeDomain(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

export function statusTone(status) {
  if (status.includes('Failed')) return 'danger'
  if (status === 'Uploaded') return 'info'
  if (status === 'Exported') return 'orange'
  return 'success'
}

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
