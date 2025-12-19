/**
 * General utility functions
 *
 * Common helper functions used throughout the application.
 *
 * Dependencies: none
 */

/**
 * Debounce function to limit how often a function can be called
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function that delays execution until wait ms have passed since last call
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   fetchSearchResults(query);
 * }, 300);
 *
 * // Rapid calls only execute once after 300ms of inactivity
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this one executes
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Sleep utility for async operations
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified milliseconds
 *
 * @example
 * ```ts
 * async function retryWithBackoff() {
 *   await sleep(1000); // Wait 1 second
 *   return tryAgain();
 * }
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Format number with locale-appropriate thousands separators
 *
 * @param num - Number to format
 * @returns Formatted string with commas (en-US locale)
 *
 * @example
 * ```ts
 * formatNumber(1234567) // => '1,234,567'
 * formatNumber(42) // => '42'
 * ```
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Clamp a number between minimum and maximum values
 *
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Value constrained to [min, max] range
 *
 * @example
 * ```ts
 * clamp(15, 0, 10) // => 10
 * clamp(-5, 0, 10) // => 0
 * clamp(5, 0, 10)  // => 5
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
