/**
 * Dashboard Stats API Route
 *
 * Provides aggregated statistics for the user dashboard.
 * Optimized with caching and parallel queries.
 *
 * Dependencies: supabase, db/queries, cache/server
 */

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import {
  getAllTimeAccuracy,
  getDailyStatsRange,
  getDashboardStats,
  getUpcomingReviewsForecast,
  getUserLessonProgress,
  getUserProfile,
  createUserProfile,
} from '@/lib/db/queries'
import * as schema from '@/lib/db/schema'
import { withCache } from '@/lib/cache/server'
import { logger } from '@/lib/utils/logger'

type DailyStat = typeof schema.dailyStats.$inferSelect

/**
 * GET /api/dashboard/stats (Optimized with caching and parallel queries)
 *
 * Performance optimizations:
 * 1. All independent queries run in parallel using Promise.all
 * 2. Single 90-day fetch for daily stats (sliced for 30-day charts)
 * 3. Cached for 5 minutes to reduce database load
 * 4. Fast path for new users with no data
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile exists, create if not (safety net)
    const profile = await getUserProfile(user.id)

    if (!profile) {
      logger.info('Creating missing profile for user', { userId: user.id })

      try {
        await createUserProfile(user.id, user.email || '')
      } catch (createError) {
        logger.error('Profile creation failed', {
          userId: user.id,
          error: createError instanceof Error ? createError.message : String(createError),
        })

        return NextResponse.json(
          {
            error: 'User profile could not be created. Please contact support.',
            errorCode: 'PROFILE_NOT_FOUND',
            details:
              process.env.NODE_ENV === 'development'
                ? {
                    userId: user.id,
                    error: createError instanceof Error ? createError.message : String(createError),
                  }
                : undefined,
          },
          { status: 404 }
        )
      }
    }

    // Try to get from cache first (5 min TTL)
    const cacheKey = `dashboard:stats:${user.id}`

    const cachedData = await withCache(
      cacheKey,
      async () => {
        // Calculate date ranges
        const endDate = new Date()
        const startDate90Days = new Date()
        startDate90Days.setDate(startDate90Days.getDate() - 90)

        // PARALLEL EXECUTION: Run ALL independent queries at once
        const [overallStats, dailyStats90d, lessonProgress, upcomingForecast, accuracyPercentage] =
          await Promise.all([
            getDashboardStats(user.id),
            getDailyStatsRange(user.id, startDate90Days, endDate), // Single 90-day query
            getUserLessonProgress(user.id),
            getUpcomingReviewsForecast(user.id),
            getAllTimeAccuracy(user.id),
          ])

        // For new users with no data, return simplified response
        if (overallStats.totalItemsLearned === 0) {
          return {
            stats: {
              totalItemsLearned: 0,
              reviewsDue: 0,
              reviewsDueToday: 0,
              currentStreak: 0,
              longestStreak: 0,
              accuracyPercentage: 0,
              reviewsCompletedToday: 0,
            },
            charts: {
              reviewsOverTime: [],
              accuracyOverTime: [],
              activityCalendar: [],
              upcomingForecast: [],
            },
            lessons: [],
          }
        }

        // Slice 30-day data from 90-day result (no extra query needed)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 30)
        const dailyStats30d = dailyStats90d.filter((stat) => stat.stat_date >= cutoffDate)

        // Transform data for charts
        const reviewsOverTime = dailyStats30d.map((stat) => ({
          date: stat.stat_date.toISOString().split('T')[0],
          reviews: stat.reviews_completed,
          newItems: stat.new_items_learned,
        }))

        const accuracyOverTime = dailyStats30d.map((stat) => ({
          date: stat.stat_date.toISOString().split('T')[0],
          accuracy: stat.accuracy_percentage,
        }))

        const activityCalendar = dailyStats90d.map((stat) => ({
          date: stat.stat_date.toISOString().split('T')[0],
          count: stat.reviews_completed,
        }))

        const reviewsCompletedToday = getTodayStats(dailyStats30d)?.reviews_completed ?? 0

        return {
          stats: {
            totalItemsLearned: overallStats.totalItemsLearned,
            reviewsDue: overallStats.reviewsDue, // Reviews due NOW (matches queue)
            reviewsDueToday: overallStats.reviewsDueToday, // Reviews due by end of day
            currentStreak: overallStats.currentStreak,
            longestStreak: overallStats.longestStreak,
            accuracyPercentage,
            reviewsCompletedToday,
          },
          charts: {
            reviewsOverTime,
            accuracyOverTime,
            activityCalendar,
            upcomingForecast,
          },
          lessons: lessonProgress.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            isCompleted: lesson.isCompleted,
            isUnlocked: lesson.isUnlocked,
          })),
        }
      },
      300 // 5 minutes cache
    )

    return NextResponse.json({
      success: true,
      data: cachedData,
    })
  } catch (error) {
    logger.error('Error fetching dashboard stats', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        error:
          'Failed to load dashboard data. Please refresh the page or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}

function getTodayStats(dailyStats: DailyStat[]) {
  const today = new Date().toISOString().split('T')[0]
  return dailyStats.find((stat) => stat.stat_date.toISOString().split('T')[0] === today)
}
