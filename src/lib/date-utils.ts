const WIB = 'Asia/Jakarta'

export function formatWIB(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', { timeZone: WIB, ...options })
}

export function formatDateWIB(dateStr: string): string {
  return formatWIB(dateStr, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTimeWIB(dateStr: string): string {
  return formatWIB(dateStr, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeWIB(dateStr: string): string {
  return formatWIB(dateStr, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDateWIB(dateStr: string): string {
  return formatWIB(dateStr, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
