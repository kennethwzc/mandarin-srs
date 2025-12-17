/**
 * Tests for date utility functions
 * Covers: formatRelativeDate, formatTimeAgo, isPast, getStartOfDay, getEndOfDay
 */

import { formatRelativeDate, formatTimeAgo, isPast, getStartOfDay, getEndOfDay } from '../date'

describe('date utilities', () => {
  describe('formatRelativeDate', () => {
    it('returns "Today" for today\'s date', () => {
      const today = new Date()
      expect(formatRelativeDate(today)).toBe('Today')
    })

    it('returns "Tomorrow" for tomorrow\'s date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(formatRelativeDate(tomorrow)).toBe('Tomorrow')
    })

    it('returns "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatRelativeDate(yesterday)).toBe('Yesterday')
    })

    it('formats past dates as "MMM d, yyyy"', () => {
      const pastDate = new Date('2024-01-15')
      expect(formatRelativeDate(pastDate)).toBe('Jan 15, 2024')
    })

    it('formats future dates as "MMM d, yyyy"', () => {
      const futureDate = new Date('2025-12-25')
      expect(formatRelativeDate(futureDate)).toBe('Dec 25, 2025')
    })

    it('handles ISO string dates', () => {
      const today = new Date().toISOString()
      expect(formatRelativeDate(today)).toBe('Today')
    })

    it('handles dates several days ago', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const result = formatRelativeDate(threeDaysAgo)
      // Should be formatted date, not relative
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
    })
  })

  describe('formatTimeAgo', () => {
    it('formats recent times correctly', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const result = formatTimeAgo(fiveMinutesAgo)
      expect(result).toContain('minutes ago')
    })

    it('formats hours ago correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const result = formatTimeAgo(twoHoursAgo)
      expect(result).toContain('hours ago')
    })

    it('formats days ago correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const result = formatTimeAgo(threeDaysAgo)
      expect(result).toContain('days ago')
    })

    it('handles ISO string dates', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const result = formatTimeAgo(date)
      expect(result).toContain('minutes ago')
    })

    it('includes "ago" suffix', () => {
      const pastDate = new Date(Date.now() - 1000)
      const result = formatTimeAgo(pastDate)
      expect(result).toMatch(/ago$/)
    })
  })

  describe('isPast', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isPast(yesterday)).toBe(true)
    })

    it('returns false for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isPast(tomorrow)).toBe(false)
    })

    it('returns false for current time (very close)', () => {
      const now = new Date()
      expect(isPast(now)).toBe(false)
    })

    it('handles ISO string dates', () => {
      const pastDate = new Date('2020-01-01').toISOString()
      expect(isPast(pastDate)).toBe(true)

      const futureDate = new Date('2030-01-01').toISOString()
      expect(isPast(futureDate)).toBe(false)
    })

    it('correctly identifies dates several hours in past', () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
      expect(isPast(sixHoursAgo)).toBe(true)
    })
  })

  describe('getStartOfDay', () => {
    it('returns start of current day by default', () => {
      const startOfDay = getStartOfDay()
      expect(startOfDay.getHours()).toBe(0)
      expect(startOfDay.getMinutes()).toBe(0)
      expect(startOfDay.getSeconds()).toBe(0)
      expect(startOfDay.getMilliseconds()).toBe(0)
    })

    it('returns start of specified day', () => {
      const someDate = new Date('2024-06-15T14:30:45.123')
      const startOfDay = getStartOfDay(someDate)

      expect(startOfDay.getFullYear()).toBe(2024)
      expect(startOfDay.getMonth()).toBe(5) // June is month 5 (0-indexed)
      expect(startOfDay.getDate()).toBe(15)
      expect(startOfDay.getHours()).toBe(0)
      expect(startOfDay.getMinutes()).toBe(0)
      expect(startOfDay.getSeconds()).toBe(0)
      expect(startOfDay.getMilliseconds()).toBe(0)
    })

    it('does not mutate original date', () => {
      const original = new Date('2024-06-15T14:30:45')
      const originalTime = original.getTime()

      getStartOfDay(original)

      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('getEndOfDay', () => {
    it('returns end of current day by default', () => {
      const endOfDay = getEndOfDay()
      expect(endOfDay.getHours()).toBe(23)
      expect(endOfDay.getMinutes()).toBe(59)
      expect(endOfDay.getSeconds()).toBe(59)
      expect(endOfDay.getMilliseconds()).toBe(999)
    })

    it('returns end of specified day', () => {
      const someDate = new Date('2024-06-15T14:30:45.123')
      const endOfDay = getEndOfDay(someDate)

      expect(endOfDay.getFullYear()).toBe(2024)
      expect(endOfDay.getMonth()).toBe(5) // June is month 5 (0-indexed)
      expect(endOfDay.getDate()).toBe(15)
      expect(endOfDay.getHours()).toBe(23)
      expect(endOfDay.getMinutes()).toBe(59)
      expect(endOfDay.getSeconds()).toBe(59)
      expect(endOfDay.getMilliseconds()).toBe(999)
    })

    it('does not mutate original date', () => {
      const original = new Date('2024-06-15T14:30:45')
      const originalTime = original.getTime()

      getEndOfDay(original)

      expect(original.getTime()).toBe(originalTime)
    })

    it('is later than start of day', () => {
      const date = new Date()
      const start = getStartOfDay(date)
      const end = getEndOfDay(date)

      expect(end.getTime()).toBeGreaterThan(start.getTime())
    })
  })
})
