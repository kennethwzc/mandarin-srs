/**
 * Server-side cache with in-memory storage
 *
 * Features:
 * - Stale-while-revalidate pattern for better UX
 * - TTL support with memory expiration
 *
 * Note: For production with multiple serverless instances,
 * consider adding Upstash Redis for shared caching.
 * See: https://upstash.com/docs/redis/sdks/ts/overview
 */

// In-memory cache storage
const memoryCache = new Map<string, { value: unknown; expires: number; staleAt: number }>()

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
}

/**
 * Cache wrapper with stale-while-revalidate pattern
 *
 * Returns cached data immediately if available.
 * If data is stale (past half TTL), triggers background revalidation.
 * If no cache exists, fetches fresh data.
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
      // If stale, trigger background revalidation
      if (memoryCached.staleAt < now) {
        // Don't await - let it run in background
        revalidateInBackground(key, fn, ttlSeconds)
      }
      return memoryCached.value as T
    }
  }

  // No valid cache - fetch fresh data
  const result = await fn()
  await setCached(key, result, ttlSeconds)

  return result
}

/**
 * Revalidate cache in background (non-blocking)
 */
async function revalidateInBackground<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<void> {
  try {
    const result = await fn()
    await setCached(key, result, ttlSeconds)
  } catch {
    // Silently fail - stale data is still available
  }
}

/**
 * Clear all cached data (useful for testing)
 */
export function clearAllCache(): void {
  memoryCache.clear()
}
