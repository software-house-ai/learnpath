export function formatDate(date: string | Date | null | undefined): string {
  if (date == null) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return ''
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return ''
  return n.toLocaleString('en-US')
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (date == null) return ''
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  }
  const years = Math.floor(days / 365)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return ''
  return `${Math.round(value * 100)}%`
}
