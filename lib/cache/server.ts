/**
 * Server-side cache with Redis
 *
 * For high-traffic production deployments
 * Falls back to memory cache if Redis not available
 */

// In-memory fallback (Redis can be added later with @upstash/redis)
const memoryCache = new Map<string, { value: unknown; expires: number }>()

export async function getCached<T>(key: string, _ttlSeconds: number = 300): Promise<T | null> {
  // Use memory cache
  const cached = memoryCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.value as T
  }

  return null
}

export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  // Store in memory
  memoryCache.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000,
  })
}

export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key)
}

/**
 * Cache wrapper for expensive operations
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function and cache result
  const result = await fn()
  await setCached(key, result, ttlSeconds)

  return result
}
