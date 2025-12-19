/**
 * Prefetching hooks for intelligent data prefetching
 *
 * Provides React hooks for prefetching data based on user behavior
 * and navigation patterns.
 */

'use client'

import { useEffect, useRef } from 'react'

import { prefetchRouteAndData, prefetchOnHover } from '@/lib/utils/prefetch'

/**
 * Check if we're in a test environment
 */
function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.CI === 'true' ||
    typeof jest !== 'undefined' ||
    typeof describe !== 'undefined'
  )
}

/**
 * Prefetch lessons data when dashboard loads
 * Only prefetches if user is likely to visit lessons (has incomplete lessons)
 *
 * @param hasIncompleteLessons - Whether user has incomplete lessons
 * @param delay - Delay before prefetching (default: 2000ms)
 */
export function usePrefetchLessons(hasIncompleteLessons: boolean, delay: number = 2000) {
  const hasPrefetched = useRef(false)

  useEffect(() => {
    if (isTestEnvironment() || !hasIncompleteLessons || hasPrefetched.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      // Prefetch lessons data
      prefetchRouteAndData('/lessons', 'lessons:prefetch', async () => {
        const response = await fetch('/api/lessons', {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch lessons')
        }
        return response.json()
      }).catch(() => {
        // Silently fail - prefetch is optional
      })

      hasPrefetched.current = true
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [hasIncompleteLessons, delay])
}

/**
 * Prefetch on hover hook
 * Attaches hover listener to element and prefetches on mouse enter
 *
 * @param ref - Ref to the element
 * @param prefetchFn - Function to call on hover
 * @param delay - Delay before prefetching (default: 150ms)
 */
export function usePrefetchOnHover(
  ref: React.RefObject<HTMLElement>,
  prefetchFn: () => void,
  delay: number = 150
) {
  useEffect(() => {
    if (isTestEnvironment() || !ref.current) {
      return undefined
    }

    const cleanup = prefetchOnHover(ref.current, prefetchFn, delay)
    return cleanup || undefined
  }, [ref, prefetchFn, delay])
}

/**
 * Prefetch route and data on mount
 * Useful for prefetching likely-to-visit pages
 *
 * @param route - Route to prefetch
 * @param dataKey - Cache key for data
 * @param dataFetcher - Function to fetch data
 * @param enabled - Whether prefetching is enabled (default: true)
 */
export function usePrefetchOnMount<T>(
  route: string,
  dataKey: string,
  dataFetcher: () => Promise<T>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (isTestEnvironment() || !enabled) {
      return
    }

    prefetchRouteAndData(route, dataKey, dataFetcher).catch(() => {
      // Silently fail - prefetch is optional
    })
  }, [route, dataKey, dataFetcher, enabled])
}
