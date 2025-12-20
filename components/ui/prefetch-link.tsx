/**
 * PrefetchLink Component
 *
 * Enhanced Next.js Link component with hover-based prefetching.
 * Prefetches both the route and its data when user hovers over the link.
 *
 * Features:
 * - Hover-based prefetching (not viewport-based)
 * - Prefetches route + data for instant navigation
 * - Configurable delay to avoid accidental prefetches
 * - Respects slow connections (skips prefetch)
 * - Graceful degradation (prefetch failures don't affect navigation)
 */

'use client'

import Link, { LinkProps } from 'next/link'
import { useRef, useEffect, useCallback, forwardRef } from 'react'

import { prefetchRouteAndData, prefetchOnHover } from '@/lib/utils/prefetch'

/**
 * Check if we're in a test environment
 */
function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.CI === 'true'
}

interface PrefetchLinkProps extends LinkProps {
  /**
   * Cache key for prefetching data
   * If provided, will prefetch data along with route
   */
  prefetchDataKey?: string

  /**
   * Function to fetch data for prefetching
   * Only used if prefetchDataKey is provided
   */
  prefetchDataFetcher?: () => Promise<unknown>

  /**
   * Delay before prefetching on hover (milliseconds)
   * Default: 150ms
   */
  prefetchDelay?: number

  /**
   * Whether to prefetch route (Next.js default behavior)
   * Set to false to use only hover-based prefetching
   * Default: false (we use hover-based instead)
   */
  prefetch?: boolean

  /**
   * Children to render
   */
  children: React.ReactNode

  /**
   * Additional className
   */
  className?: string
}

/**
 * PrefetchLink - Enhanced Link with hover-based prefetching
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (
    {
      href,
      prefetchDataKey,
      prefetchDataFetcher,
      prefetchDelay = 150,
      prefetch = false, // Disable automatic prefetch, use hover instead
      className,
      children,
      ...props
    },
    forwardedRef
  ) => {
    const linkRef = useRef<HTMLAnchorElement>(null)
    const hasPrefetched = useRef(false)

    // Use forwarded ref or internal ref
    const ref = (forwardedRef as React.RefObject<HTMLAnchorElement>) || linkRef

    const handlePrefetch = useCallback(() => {
      if (isTestEnvironment() || hasPrefetched.current) {
        return // Skip in test environment or already prefetched
      }

      const route = typeof href === 'string' ? href : href.pathname || ''

      if (prefetchDataKey && prefetchDataFetcher) {
        // Prefetch both route and data
        prefetchRouteAndData(route, prefetchDataKey, prefetchDataFetcher).catch(() => {
          // Silently fail - prefetch is optional
        })
      } else {
        // Just prefetch route (Next.js will handle this, but we can trigger it manually)
        // For App Router, we can't directly prefetch routes, but we can warm up the cache
        if (typeof window !== 'undefined') {
          fetch(route, { method: 'HEAD', credentials: 'include' }).catch(() => {
            // Silently fail
          })
        }
      }

      hasPrefetched.current = true
    }, [href, prefetchDataKey, prefetchDataFetcher])

    // Attach hover listener
    useEffect(() => {
      // Skip in test environment
      if (isTestEnvironment()) {
        return undefined
      }

      // Wait for ref to be set
      const element = ref.current
      if (!element) {
        return undefined
      }

      const cleanup = prefetchOnHover(element, handlePrefetch, prefetchDelay)
      return cleanup || undefined
    }, [ref, handlePrefetch, prefetchDelay])

    return (
      <Link ref={ref} href={href} prefetch={prefetch} className={className} {...props}>
        {children}
      </Link>
    )
  }
)

PrefetchLink.displayName = 'PrefetchLink'
