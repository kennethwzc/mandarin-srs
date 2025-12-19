/**
 * Request helper utilities for safe async operations
 *
 * Provides utilities for handling async operations that may be aborted
 * during React Server Component rendering (e.g., when user navigates away).
 *
 * Key features:
 * - Detects aborted/cancelled requests
 * - Provides fallback values for transient errors
 * - Distinguishes between recoverable and fatal errors
 */

/**
 * Error types that indicate a request was aborted or connection was lost.
 * These are transient errors that should not show error UI.
 */
const ABORTED_ERROR_PATTERNS = [
  'aborted',
  'abort',
  'cancelled',
  'canceled',
  'connection closed',
  'connection reset',
  'network error',
  'fetch failed',
  'socket hang up',
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
] as const

/**
 * Check if an error indicates an aborted or cancelled request.
 * These errors occur during rapid navigation and should be handled gracefully.
 *
 * @param error - The error to check
 * @returns true if the error is from an aborted request
 */
export function isAbortedError(error: unknown): boolean {
  if (!error) {
    return false
  }

  // Check for AbortError (standard fetch abort)
  if (error instanceof Error && error.name === 'AbortError') {
    return true
  }

  // Check for DOMException with abort
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return true
    }
  }

  // Check error message for known patterns
  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return ABORTED_ERROR_PATTERNS.some((pattern) => errorMessage.includes(pattern.toLowerCase()))
}

/**
 * Check if an error is an authentication error.
 * These should trigger a redirect to login.
 *
 * @param error - The error to check
 * @returns true if the error is auth-related
 */
export function isAuthError(error: unknown): boolean {
  if (!error) {
    return false
  }

  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  const authPatterns = [
    'unauthorized',
    'unauthenticated',
    'not authenticated',
    'session expired',
    'invalid token',
    'jwt expired',
    'auth',
  ]

  return authPatterns.some((pattern) => errorMessage.includes(pattern))
}

/**
 * Execute an async operation with graceful error handling for aborted requests.
 *
 * If the operation is aborted (e.g., user navigated away), returns the fallback value
 * instead of throwing an error. This prevents error boundaries from triggering
 * during rapid navigation.
 *
 * @param operation - Async function to execute
 * @param fallback - Value to return if operation is aborted
 * @returns Result of operation or fallback value
 *
 * @example
 * ```ts
 * const data = await safeAsync(
 *   () => fetchDashboardData(userId),
 *   { stats: defaultStats, charts: defaultCharts }
 * )
 * ```
 */
export async function safeAsync<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isAbortedError(error)) {
      // Request was aborted - return fallback silently
      return fallback
    }
    // Re-throw other errors for proper handling
    throw error
  }
}

/**
 * Execute an async operation with a timeout.
 * If the operation takes longer than the timeout, throws a timeout error.
 *
 * @param operation - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Message for timeout error
 * @returns Result of operation
 *
 * @example
 * ```ts
 * const data = await withTimeout(
 *   () => slowQuery(),
 *   5000,
 *   'Query timed out'
 * )
 * ```
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([operation(), timeoutPromise])
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    return result
  } catch (error) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    throw error
  }
}

/**
 * Execute an async operation with retry logic.
 * Retries on transient errors, gives up on fatal errors.
 *
 * @param operation - Async function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @param delayMs - Delay between retries in milliseconds (default: 100)
 * @returns Result of operation
 *
 * @example
 * ```ts
 * const data = await withRetry(
 *   () => flakyApiCall(),
 *   3,
 *   200
 * )
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delayMs = 100
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry aborted requests or auth errors
      if (isAbortedError(error) || isAuthError(error)) {
        throw error
      }

      // If we have more retries, wait and try again
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError
}

/**
 * Combine multiple error handling strategies.
 * Executes operation with timeout, retry, and abort handling.
 *
 * @param operation - Async function to execute
 * @param options - Configuration options
 * @returns Result of operation or fallback
 *
 * @example
 * ```ts
 * const data = await resilientAsync(
 *   () => fetchData(),
 *   {
 *     fallback: defaultData,
 *     timeoutMs: 5000,
 *     retries: 2
 *   }
 * )
 * ```
 */
export async function resilientAsync<T>(
  operation: () => Promise<T>,
  options: {
    fallback: T
    timeoutMs?: number
    retries?: number
    retryDelayMs?: number
  }
): Promise<T> {
  const { fallback, timeoutMs = 10000, retries = 1, retryDelayMs = 100 } = options

  try {
    return await withRetry(
      () => withTimeout(operation, timeoutMs, 'Request timed out'),
      retries,
      retryDelayMs
    )
  } catch (error) {
    if (isAbortedError(error)) {
      return fallback
    }
    throw error
  }
}
