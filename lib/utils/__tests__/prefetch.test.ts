/**
 * Prefetch Utilities Tests
 *
 * Tests for prefetch utilities to ensure they work correctly
 * and skip execution in test environments.
 */

import {
  prefetchRoute,
  prefetchData,
  prefetchRouteAndData,
  prefetchViaServiceWorker,
  prefetchOnHover,
} from '../prefetch'

// Mock the preload function from use-swr
jest.mock('@/lib/hooks/use-swr', () => ({
  preload: jest.fn().mockResolvedValue(undefined),
}))

describe('prefetch utilities', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment
    delete (process.env as { NODE_ENV?: string }).NODE_ENV
    delete (process.env as { CI?: string }).CI
    // Mock fetch
    mockFetch = jest.fn().mockResolvedValue({ ok: true })
    // Mock window and navigator
    ;(global as { window?: Window }).window = {
      ...global.window,
      fetch: mockFetch,
    } as unknown as Window
    ;(global as { navigator?: Navigator }).navigator = {
      connection: { effectiveType: '4g' },
      serviceWorker: {
        ready: Promise.resolve({
          active: {
            postMessage: jest.fn(),
          },
        }),
      },
    } as unknown as Navigator
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('prefetchRoute', () => {
    it('returns early in test environment', () => {
      process.env.NODE_ENV = 'test'
      prefetchRoute('/test')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns early when window is undefined', () => {
      const originalWindow = global.window
      delete (global as { window?: Window }).window
      prefetchRoute('/test')
      // Should not throw
      global.window = originalWindow
    })

    it('skips prefetch on slow connections', () => {
      process.env.NODE_ENV = 'development'
      process.env.CI = ''
      // Mock jest and describe as undefined to simulate non-test environment
      const originalJest = (global as { jest?: typeof jest }).jest
      const originalDescribe = (global as { describe?: typeof describe }).describe
      delete (global as { jest?: typeof jest }).jest
      delete (global as { describe?: typeof describe }).describe
      ;(global.navigator as Navigator & { connection?: { effectiveType?: string } }).connection = {
        effectiveType: '2g',
      } as NetworkInformation
      prefetchRoute('/test')
      expect(mockFetch).not.toHaveBeenCalled()

      // Restore
      if (originalJest) {
        ;(global as { jest?: typeof jest }).jest = originalJest
      }
      if (originalDescribe) {
        ;(global as { describe?: typeof describe }).describe = originalDescribe
      }
    })
  })

  describe('prefetchData', () => {
    it('returns early in test environment', async () => {
      process.env.NODE_ENV = 'test'
      const { preload } = await import('@/lib/hooks/use-swr')
      const preloadSpy = preload as jest.Mock
      jest.clearAllMocks()
      await prefetchData('test:key', async () => ({ data: 'test' }))
      expect(preloadSpy).not.toHaveBeenCalled()
    })

    it('returns early when window is undefined', async () => {
      const originalWindow = global.window
      delete (global as { window?: Window }).window
      await prefetchData('test:key', async () => ({ data: 'test' }))
      // Should not throw
      global.window = originalWindow
    })

    it('handles prefetch errors gracefully', async () => {
      process.env.NODE_ENV = 'development'
      process.env.CI = ''
      const originalJest = (global as { jest?: typeof jest }).jest
      const originalDescribe = (global as { describe?: typeof describe }).describe
      delete (global as { jest?: typeof jest }).jest
      delete (global as { describe?: typeof describe }).describe

      const { preload } = await import('@/lib/hooks/use-swr')
      const preloadSpy = preload as jest.Mock
      preloadSpy.mockRejectedValueOnce(new Error('Prefetch failed'))

      await prefetchData('test:key', async () => {
        throw new Error('Fetcher error')
      })
      // Should not throw - errors are caught and ignored

      // Restore
      if (originalJest) {
        ;(global as { jest?: typeof jest }).jest = originalJest
      }
      if (originalDescribe) {
        ;(global as { describe?: typeof describe }).describe = originalDescribe
      }
    })
  })

  describe('prefetchRouteAndData', () => {
    it('returns early in test environment', async () => {
      process.env.NODE_ENV = 'test'
      const { preload } = await import('@/lib/hooks/use-swr')
      const preloadSpy = preload as jest.Mock
      jest.clearAllMocks()
      await prefetchRouteAndData('/test', 'test:key', async () => ({ data: 'test' }))
      expect(mockFetch).not.toHaveBeenCalled()
      expect(preloadSpy).not.toHaveBeenCalled()
    })
  })

  describe('prefetchViaServiceWorker', () => {
    it('returns early in test environment', () => {
      process.env.NODE_ENV = 'test'
      prefetchViaServiceWorker('/test')
      // Should not throw or call service worker
    })

    it('returns early when service worker is not available', () => {
      process.env.NODE_ENV = 'development'
      process.env.CI = ''
      const originalJest = (global as { jest?: typeof jest }).jest
      const originalDescribe = (global as { describe?: typeof describe }).describe
      delete (global as { jest?: typeof jest }).jest
      delete (global as { describe?: typeof describe }).describe

      delete (global.navigator as Navigator & { serviceWorker?: ServiceWorkerContainer })
        .serviceWorker
      prefetchViaServiceWorker('/test')
      // Should not throw

      // Restore
      if (originalJest) {
        ;(global as { jest?: typeof jest }).jest = originalJest
      }
      if (originalDescribe) {
        ;(global as { describe?: typeof describe }).describe = originalDescribe
      }
    })
  })

  describe('prefetchOnHover', () => {
    it('returns undefined in test environment', () => {
      process.env.NODE_ENV = 'test'
      const element = document.createElement('div')
      const result = prefetchOnHover(element, jest.fn(), 150)
      expect(result).toBeUndefined()
    })

    it('returns undefined when element is null', () => {
      process.env.NODE_ENV = 'development'
      const result = prefetchOnHover(null, jest.fn(), 150)
      expect(result).toBeUndefined()
    })

    it('correctly skips in test environment (expected behavior)', () => {
      // In test environment, prefetchOnHover should return undefined
      // This is the expected behavior - we don't want prefetching during tests
      process.env.NODE_ENV = 'test'
      const element = document.createElement('div')
      const prefetchFn = jest.fn()
      const cleanup = prefetchOnHover(element, prefetchFn, 150)
      expect(cleanup).toBeUndefined()
      // Verify prefetch function was not called
      expect(prefetchFn).not.toHaveBeenCalled()
    })
  })
})
