/**
 * Server-side cache with Redis support
 *
 * Uses Upstash Redis for persistent caching across serverless instances.
 * Falls back to in-memory cache if Redis is not configured.
 *
 * Features:
 * - Stale-while-revalidate pattern for better UX
 * - Automatic fallback to memory cache
 * - TTL support with Redis or memory expiration
 */

// In-memory fallback cache
const memoryCache = new Map<string, { value: unknown; expires: number; staleAt: number }>()

// Lazy-loaded Redis client (only imports if env vars are set)
let redisClient: {
  get: <T>(key: string) => Promise<T | null>
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<void>
  del: (key: string) => Promise<void>
} | null = null

let redisInitialized = false

/**
 * Initialize Redis client if environment variables are set
 *
 * Note: @upstash/redis is an optional dependency.
 * Install it with: pnpm add @upstash/redis
 * Then set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 */
async function getRedisClient() {
  if (redisInitialized) {
    return redisClient
  }

  redisInitialized = true

  // Only initialize if both env vars are present
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      // Dynamic import to avoid bundling if not used
      // This will fail if @upstash/redis is not installed, which is fine
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const upstashModule = require('@upstash/redis') as any
      const Redis = upstashModule.Redis
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Cache] Upstash Redis initialized')
      }
    } catch {
      // Redis not available - using memory cache only
      // This is expected if @upstash/redis is not installed
      redisClient = null
    }
  }

  return redisClient
}

/**
 * Get a value from cache
 *
 * @param key - Cache key
 * @param _ttlSeconds - Not used for get, but kept for API compatibility
 * @returns Cached value or null if not found/expired
 */
export async function getCached<T>(key: string, _ttlSeconds: number = 300): Promise<T | null> {
  // Try Redis first
  const redis = await getRedisClient()
  if (redis) {
    try {
      const cached = await redis.get<T>(key)
      if (cached !== null) {
        return cached
      }
    } catch (error) {
      // Log error but fall through to memory cache
      if (process.env.NODE_ENV === 'development') {
        console.error('[Cache] Redis get error:', error)
      }
    }
  }

  // Fallback to memory cache
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

  // Try Redis first
  const redis = await getRedisClient()
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Cache] Redis set error:', error)
      }
    }
  }

  // Always also set in memory cache (for faster reads and fallback)
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
  // Delete from Redis
  const redis = await getRedisClient()
  if (redis) {
    try {
      await redis.del(key)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Cache] Redis del error:', error)
      }
    }
  }

  // Always delete from memory cache
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
  // Try to get from Redis first
  const redis = await getRedisClient()
  if (redis) {
    try {
      const cached = await redis.get<T>(key)
      if (cached !== null) {
        return cached
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Cache] Redis get error in withCache:', error)
      }
    }
  }

  // Check memory cache
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
  } catch (error) {
    // Silently fail - stale data is still available
    if (process.env.NODE_ENV === 'development') {
      console.error('[Cache] Background revalidation failed:', error)
    }
  }
}

/**
 * Clear all cached data (useful for testing)
 */
export function clearAllCache(): void {
  memoryCache.clear()
}
