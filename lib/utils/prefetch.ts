/**
 * Prefetching utilities for routes and data
 *
 * Provides utilities for prefetching both Next.js routes and their associated data.
 * This enables instant navigation by preloading both the route bundles and the data
 * needed to render the page.
 */

import { preload } from '@/lib/hooks/use-swr'

/**
 * Check if we're in a test environment
 * Prefetch utilities should skip execution during tests
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
 * Check if connection is slow (should skip prefetching)
 */
function isSlowConnection(): boolean {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return false
  }

  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } })
    .connection

  if (!connection || !connection.effectiveType) {
    return false
  }

  // Skip prefetch on slow connections (2g, slow-3g)
  const slowTypes = ['2g', 'slow-2g']
  return slowTypes.includes(connection.effectiveType)
}

/**
 * Prefetch a Next.js route
 * This prefetches the route bundle, but not the Server Component data
 *
 * Note: In Next.js App Router, route prefetching is handled automatically by Link components.
 * This function can be used to warm up the route by making a HEAD request.
 *
 * @param route - The route to prefetch (e.g., '/lessons')
 */
export function prefetchRoute(route: string): void {
  if (typeof window === 'undefined' || isTestEnvironment()) {
    return
  }

  if (isSlowConnection()) {
    return // Skip prefetch on slow connections
  }

  try {
    // For App Router, we can't directly prefetch routes from client code
    // But we can warm up the route by making a HEAD request
    // This helps with DNS resolution and connection establishment
    fetch(route, { method: 'HEAD', credentials: 'include' }).catch(() => {
      // Silently fail - prefetch is optional
    })
  } catch {
    // Silently fail - prefetch is optional
  }
}

/**
 * Prefetch data into cache
 * Uses the existing SWR cache system
 *
 * @param key - Cache key for the data
 * @param fetcher - Function that fetches the data
 */
export async function prefetchData<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  if (typeof window === 'undefined' || isTestEnvironment()) {
    return
  }

  if (isSlowConnection()) {
    return // Skip prefetch on slow connections
  }

  try {
    await preload(key, fetcher)
  } catch {
    // Silently fail - prefetch is optional
  }
}

/**
 * Prefetch both route and data
 * This provides the best user experience - instant navigation with data ready
 *
 * @param route - The route to prefetch
 * @param dataKey - Cache key for the data
 * @param dataFetcher - Function that fetches the data
 */
export async function prefetchRouteAndData<T>(
  route: string,
  dataKey: string,
  dataFetcher: () => Promise<T>
): Promise<void> {
  if (typeof window === 'undefined' || isTestEnvironment()) {
    return
  }

  if (isSlowConnection()) {
    return // Skip prefetch on slow connections
  }

  // Prefetch route and data in parallel
  await Promise.all([prefetchRoute(route), prefetchData(dataKey, dataFetcher)])
}

/**
 * Prefetch via service worker (background prefetching)
 * Service worker can prefetch even when tab is inactive
 *
 * @param url - URL to prefetch
 */
export function prefetchViaServiceWorker(url: string): void {
  if (typeof window === 'undefined' || isTestEnvironment() || !('serviceWorker' in navigator)) {
    return
  }

  if (isSlowConnection()) {
    return // Skip prefetch on slow connections
  }

  try {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'PREFETCH',
          url,
        })
      }
    })
  } catch {
    // Silently fail - prefetch is optional
  }
}

/**
 * Prefetch on hover helper
 * Adds hover event listener with debounce to prefetch on mouse enter
 *
 * @param element - DOM element to attach hover listener
 * @param prefetchFn - Function to call on hover
 * @param delay - Delay in milliseconds before prefetching (default: 150ms)
 * @returns Cleanup function to remove listener, or undefined if element is invalid
 */
export function prefetchOnHover(
  element: HTMLElement | null,
  prefetchFn: () => void,
  delay: number = 150
): (() => void) | undefined {
  if (!element || typeof window === 'undefined' || isTestEnvironment()) {
    return undefined
  }

  let timeoutId: NodeJS.Timeout | null = null
  let hasPrefetched = false

  const handleMouseEnter = () => {
    if (hasPrefetched) {
      return // Already prefetched
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      prefetchFn()
      hasPrefetched = true
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  element.addEventListener('mouseenter', handleMouseEnter)
  element.addEventListener('mouseleave', handleMouseLeave)

  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter)
    element.removeEventListener('mouseleave', handleMouseLeave)
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
