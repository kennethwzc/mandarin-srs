/**
 * Custom SWR (Stale-While-Revalidate) Hook
 *
 * Lightweight implementation without external dependencies.
 * Provides client-side caching with automatic revalidation.
 *
 * Features:
 * - In-memory cache with TTL
 * - Automatic revalidation on focus
 * - Deduplication of requests
 * - Manual mutation support
 * - TypeScript support
 *
 * Usage:
 * ```tsx
 * const { data, error, isLoading, mutate } = useSWR(
 *   '/api/dashboard/stats',
 *   () => fetch('/api/dashboard/stats').then(r => r.json())
 * )
 * ```
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Global cache shared across all hook instances
const cache = new Map<string, { data: unknown; timestamp: number }>()

// Track in-flight requests to deduplicate
const inflight = new Map<string, Promise<unknown>>()

interface UseSWROptions {
  // Revalidate when window regains focus (default: true)
  revalidateOnFocus?: boolean
  // Minimum time between requests for same key (ms, default: 2000)
  dedupingInterval?: number
  // Cache TTL in milliseconds (default: 60000 = 1 minute)
  cacheTTL?: number
  // Callback on successful fetch
  onSuccess?: (data: unknown) => void
  // Callback on error
  onError?: (error: Error) => void
}

interface UseSWRReturn<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: (newData?: T | Promise<T>) => Promise<void>
}

export function useSWR<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseSWROptions = {}
): UseSWRReturn<T> {
  const {
    revalidateOnFocus = true,
    dedupingInterval = 2000,
    cacheTTL = 60000,
    onSuccess,
    onError,
  } = options

  // Initialize with cached data if available
  const [data, setData] = useState<T | null>(() => {
    if (!key) {
      return null
    }
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data as T
    }
    return null
  })

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(!data)
  const [isValidating, setIsValidating] = useState(false)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  const lastFetchTime = useRef<number>(0)

  // Fetch function with deduplication and caching
  const fetchData = useCallback(
    async (force = false) => {
      if (!key) {
        return
      }

      // Check if we should skip due to deduplication interval
      const now = Date.now()
      if (!force && now - lastFetchTime.current < dedupingInterval) {
        return
      }

      // Check if there's already an in-flight request for this key
      const existing = inflight.get(key)
      if (existing && !force) {
        try {
          const result = await existing
          if (isMounted.current) {
            setData(result as T)
            setError(null)
          }
          return
        } catch (err) {
          if (isMounted.current) {
            setError(err as Error)
          }
          return
        }
      }

      setIsValidating(true)
      lastFetchTime.current = now

      // Create new request and store as in-flight
      const fetchPromise = fetcher()
      inflight.set(key, fetchPromise)

      try {
        const result = await fetchPromise
        if (isMounted.current) {
          cache.set(key, { data: result, timestamp: Date.now() })
          setData(result)
          setError(null)
          setIsLoading(false)
          onSuccess?.(result)
        }
      } catch (err) {
        if (isMounted.current) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          setIsLoading(false)
          onError?.(error)
        }
      } finally {
        inflight.delete(key)
        if (isMounted.current) {
          setIsValidating(false)
        }
      }
    },
    [key, fetcher, dedupingInterval, onSuccess, onError]
  )

  // Manual mutation function
  const mutate = useCallback(
    async (newData?: T | Promise<T>) => {
      if (!key) {
        return
      }

      if (newData !== undefined) {
        // Optimistic update
        if (newData instanceof Promise) {
          try {
            const resolved = await newData
            cache.set(key, { data: resolved, timestamp: Date.now() })
            if (isMounted.current) {
              setData(resolved)
              setError(null)
            }
          } catch (err) {
            if (isMounted.current) {
              setError(err instanceof Error ? err : new Error(String(err)))
            }
          }
        } else {
          cache.set(key, { data: newData, timestamp: Date.now() })
          if (isMounted.current) {
            setData(newData)
            setError(null)
          }
        }
      } else {
        // Revalidate
        await fetchData(true)
      }
    },
    [key, fetchData]
  )

  // Initial fetch
  useEffect(() => {
    if (!key) {
      return
    }

    fetchData()
  }, [key, fetchData])

  // Revalidate on focus
  useEffect(() => {
    if (!key || !revalidateOnFocus) {
      return
    }

    const handleFocus = () => {
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [key, revalidateOnFocus, fetchData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return { data, error, isLoading, isValidating, mutate }
}

/**
 * Preload data into cache without rendering
 * Useful for prefetching
 */
export async function preload<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  if (inflight.has(key)) {
    return
  }

  const fetchPromise = fetcher()
  inflight.set(key, fetchPromise)

  try {
    const result = await fetchPromise
    cache.set(key, { data: result, timestamp: Date.now() })
  } catch {
    // Silently fail for preload
  } finally {
    inflight.delete(key)
  }
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Get cached value without triggering a fetch
 */
export function getCachedValue<T>(key: string): T | null {
  const cached = cache.get(key)
  return cached ? (cached.data as T) : null
}
