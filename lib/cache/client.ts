/**
 * Client-side cache configuration
 *
 * Uses React Query for intelligent caching and revalidation
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,

      // Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry failed requests
      retry: 1,

      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
  },
})

/**
 * Cache keys for consistent invalidation
 */
export const CACHE_KEYS = {
  dashboardStats: ['dashboard', 'stats'] as const,
  reviewQueue: ['reviews', 'queue'] as const,
  lessons: ['lessons'] as const,
  lessonDetail: (id: number) => ['lessons', id] as const,
  userProfile: ['user', 'profile'] as const,
}
