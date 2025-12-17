/**
 * Tests for general utility functions
 * Covers: debounce, sleep, formatNumber, clamp
 */

import { debounce, sleep, formatNumber, clamp } from '../helpers'

describe('helpers', () => {
  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
      expect(formatNumber(42)).toBe('42')
    })

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('handles negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000')
      expect(formatNumber(-42)).toBe('-42')
    })

    it('handles decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
      expect(formatNumber(999.99)).toBe('999.99')
    })
  })

  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(7, 0, 10)).toBe(7)
    })

    it('clamps value below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(-100, 0, 10)).toBe(0)
    })

    it('clamps value above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10)
      expect(clamp(1000, 0, 10)).toBe(10)
    })

    it('handles edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    it('works with negative ranges', () => {
      expect(clamp(-5, -10, 0)).toBe(-5)
      expect(clamp(-15, -10, 0)).toBe(-10)
      expect(clamp(5, -10, 0)).toBe(0)
    })
  })

  describe('sleep', () => {
    it('waits for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start
      // Allow 5ms tolerance for timing variations
      expect(elapsed).toBeGreaterThanOrEqual(95)
      expect(elapsed).toBeLessThan(150)
    })

    it('works with zero milliseconds', async () => {
      const start = Date.now()
      await sleep(0)
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })

    it('resolves promise', async () => {
      const result = await sleep(10)
      expect(result).toBeUndefined()
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('debounces function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Call multiple times rapidly
      debouncedFn('a')
      debouncedFn('b')
      debouncedFn('c')

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast-forward time
      jest.advanceTimersByTime(100)

      // Function should be called once with last argument
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('c')
    })

    it('resets timer on subsequent calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('a')
      jest.advanceTimersByTime(50)

      // Call again - this should reset the timer
      debouncedFn('b')
      jest.advanceTimersByTime(50)

      // Function should not be called yet (only 50ms since last call)
      expect(mockFn).not.toHaveBeenCalled()

      // Advance another 50ms (now 100ms since last call)
      jest.advanceTimersByTime(50)

      // Now it should be called with the last argument
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('b')
    })

    it('allows calls after debounce period', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')

      // Call again after debounce period
      debouncedFn('second')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('second')
    })

    it('handles multiple arguments', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2', 'arg3')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('handles no arguments', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith()
    })
  })
})
