import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge Tailwind classes safely
 * Usage: cn('px-4 py-2', isActive && 'bg-blue-500')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
