import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge Tailwind classes safely
 * Usage: cn('px-4 py-2', isActive && 'bg-blue-500')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a YYYY-MM-DD date string → "4 Jul 2026"
 */
export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  try {
    if (String(dateStr).includes('T') || String(dateStr).includes(':')) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    }
    // Parse as local date to avoid timezone shift
    const [y, m, d] = String(dateStr).split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Format an ISO timestamp → { date: "4 Jul 2026", time: "04:30 PM" }
 */
export function fmtTimestamp(isoStr) {
  if (!isoStr) return null
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return null
    const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    return { date, time }
  } catch {
    return null
  }
}
