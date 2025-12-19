/**
 * Server-side cache with in-memory storage
 *
 * Features:
 * - Stale-while-revalidate pattern for better UX
 * - TTL support with memory expiration
 * - In-flight request deduplication to prevent race conditions
 *
 * Note: For production with multiple serverless instances,
 * consider adding Upstash Redis for shared caching.
 * See: https://upstash.com/docs/redis/sdks/ts/overview
 */

// In-memory cache storage
const memoryCache = new Map<string, { value: unknown; expires: number; staleAt: number }>()

// Track in-flight requests to prevent duplicate concurrent fetches
// Key: cache key, Value: Promise that resolves when fetch completes
const inFlightRequests = new Map<string, Promise<unknown>>()

// Track background revalidations to prevent duplicate revalidations
const revalidatingKeys = new Set<string>()

/**
 * Get a value from cache
 *
 * @param key - Cache key
 * @param _ttlSeconds - Not used for get, but kept for API compatibility
 * @returns Cached value or null if not found/expired
 */
export async function getCached<T>(key: string, _ttlSeconds: number = 300): Promise<T | null> {
  const cached = memoryCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.value as T
  }

  // Clean up expired entry
  if (cached) {
    memoryCache.delete(key)
  }

  return null
}

/**
 * Set a value in cache
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000
  const staleAt = Date.now() + (ttlSeconds / 2) * 1000 // Stale at half TTL

  memoryCache.set(key, {
    value,
    expires: expiresAt,
    staleAt,
  })
}

/**
 * Delete a value from cache
 *
 * @param key - Cache key to delete
 */
export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key)
  // Also clear any in-flight request for this key
  inFlightRequests.delete(key)
}

/**
 * Cache wrapper with stale-while-revalidate pattern and request deduplication
 *
 * Features:
 * - Returns cached data immediately if available
 * - If data is stale (past half TTL), triggers background revalidation
 * - If no cache exists, fetches fresh data
 * - Deduplicates concurrent requests for the same key
 *
 * Request Deduplication:
 * If multiple requests come in for the same key simultaneously,
 * only one fetch is executed. All requests share the same Promise.
 * This prevents race conditions and reduces database load.
 *
 * @param key - Cache key
 * @param fn - Function to fetch fresh data
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 * @returns Cached or fresh data
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const memoryCached = memoryCache.get(key)
  if (memoryCached) {
    const now = Date.now()

    // If not expired, return cached value
    if (memoryCached.expires > now) {
      // If stale, trigger background revalidation (deduplicated)
      if (memoryCached.staleAt < now) {
        revalidateInBackground(key, fn, ttlSeconds)
      }
      return memoryCached.value as T
    }
  }

  // Check if there's already an in-flight request for this key
  const existingRequest = inFlightRequests.get(key)
  if (existingRequest) {
    // Wait for the existing request to complete
    return existingRequest as Promise<T>
  }

  // Create a new request and track it
  const requestPromise = (async () => {
    try {
      const result = await fn()
      await setCached(key, result, ttlSeconds)
      return result
    } finally {
      // Clean up the in-flight tracking when done
      inFlightRequests.delete(key)
    }
  })()

  // Store the promise so concurrent requests can share it
  inFlightRequests.set(key, requestPromise)

  return requestPromise
}

/**
 * Revalidate cache in background (non-blocking, deduplicated)
 *
 * Only one background revalidation per key can run at a time.
 * Subsequent calls while revalidation is in progress are ignored.
 */
function revalidateInBackground<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): void {
  // Skip if already revalidating this key
  if (revalidatingKeys.has(key)) {
    return
  }

  // Mark as revalidating
  revalidatingKeys.add(key)

  // Don't await - let it run in background
  fn()
    .then((result) => {
      setCached(key, result, ttlSeconds)
    })
    .catch(() => {
      // Silently fail - stale data is still available
    })
    .finally(() => {
      // Clean up revalidation tracking
      revalidatingKeys.delete(key)
    })
}

/**
 * Clear all cached data (useful for testing)
 */
export function clearAllCache(): void {
  memoryCache.clear()
  inFlightRequests.clear()
  revalidatingKeys.clear()
}
