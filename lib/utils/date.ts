import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

/**
 * Format date to user-friendly string
 * Examples: "Today", "Tomorrow", "Yesterday", "Jan 15, 2024"
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (isToday(dateObj)) {
    return 'Today'
  }
  if (isTomorrow(dateObj)) {
    return 'Tomorrow'
  }
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }

  return format(dateObj, 'MMM d, yyyy')
}

/**
 * Format date to relative time
 * Examples: "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj < new Date()
}

/**
 * Get start of day in user's timezone
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day in user's timezone
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
