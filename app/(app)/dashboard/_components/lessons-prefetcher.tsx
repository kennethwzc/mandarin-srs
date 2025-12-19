/**
 * Lessons Prefetcher Component
 *
 * Prefetches lessons data when dashboard loads, but only if user is likely to visit lessons.
 * Runs silently in the background after dashboard critical data has loaded.
 */

'use client'

import { usePrefetchLessons } from '@/lib/hooks/use-prefetch'

interface LessonsPrefetcherProps {
  /**
   * Whether user has incomplete lessons (likely to visit lessons page)
   */
  hasIncompleteLessons: boolean
}

/**
 * Lessons Prefetcher
 * Prefetches lessons data in background if user is likely to visit
 */
export function LessonsPrefetcher({ hasIncompleteLessons }: LessonsPrefetcherProps) {
  // Prefetch lessons data after 2 seconds (allowing critical dashboard data to load first)
  usePrefetchLessons(hasIncompleteLessons, 2000)

  // This component doesn't render anything
  return null
}
