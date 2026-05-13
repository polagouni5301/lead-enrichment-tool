import type { LeadStatus } from '../types/lead'

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

export function statusTone(status: LeadStatus) {
  if (status.includes('Failed')) return 'danger'
  if (status === 'Uploaded') return 'info'
  if (status === 'Exported') return 'orange'
  return 'success'
}

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
