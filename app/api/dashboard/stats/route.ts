/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import {
  getDailyStatsRange,
  getDashboardStats,
  getUpcomingReviewsForecast,
  getUserLessonProgress,
} from '@/lib/db/queries'
import * as schema from '@/lib/db/schema'
import { withCache } from '@/lib/cache/server'

type DailyStat = typeof schema.dailyStats.$inferSelect

/**
 * GET /api/dashboard/stats (Optimized with caching)
 *
 * Fetch comprehensive dashboard statistics for the current user.
 * Cached for 5 minutes to reduce database load.
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
    const { getUserProfile, createUserProfile } = await import('@/lib/db/queries')
    const profile = await getUserProfile(user.id)

    if (!profile) {
      console.error('⚠️  Profile not found for user:', {
        userId: user.id,
        email: user.email,
      })

      try {
        console.log('⚠️  Creating missing profile for user:', {
          userId: user.id,
          email: user.email,
        })

        await createUserProfile(user.id, user.email || '')

        console.log('✅ Successfully created profile for user:', user.id)
      } catch (createError) {
        console.error('❌ CRITICAL: Profile creation failed:', {
          userId: user.id,
          email: user.email,
          error: createError instanceof Error ? createError.message : createError,
          stack: createError instanceof Error ? createError.stack : undefined,
          errorType: createError?.constructor?.name,
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

    // Try to get from cache (5 min TTL)
    const cacheKey = `dashboard:stats:${user.id}`

    const cachedData = await withCache(
      cacheKey,
      async () => {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        // Fetch all data in parallel for better performance
        const [overallStats, dailyStats, lessonProgress] = await Promise.all([
          getDashboardStats(user.id),
          getDailyStatsRange(user.id, startDate, endDate),
          getUserLessonProgress(user.id),
        ])

        const reviewsOverTime = dailyStats.map((stat) => ({
          date: stat.stat_date.toISOString().split('T')[0],
          reviews: stat.reviews_completed,
          newItems: stat.new_items_learned,
        }))

        const accuracyOverTime = dailyStats.map((stat) => ({
          date: stat.stat_date.toISOString().split('T')[0],
          accuracy: stat.accuracy_percentage,
        }))

        const calendarStartDate = new Date()
        calendarStartDate.setDate(calendarStartDate.getDate() - 365)
        const yearlyStats = await getDailyStatsRange(user.id, calendarStartDate, endDate)
        const activityCalendar = yearlyStats.map((stat) => ({
          date: stat.stat_date.toISOString().split('T')[0],
          count: stat.reviews_completed,
        }))

        const upcomingForecast = await getUpcomingReviewsForecast(user.id)
        const accuracyPercentage = calculateOverallAccuracy(dailyStats)
        const reviewsCompletedToday = getTodayStats(dailyStats)?.reviews_completed ?? 0

        return {
          stats: {
            totalItemsLearned: overallStats.totalItemsLearned,
            reviewsDueToday: overallStats.reviewsDueToday ?? overallStats.reviewsDue,
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
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to load dashboard data. Please refresh the page or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}

function calculateOverallAccuracy(dailyStats: DailyStat[]): number {
  if (dailyStats.length === 0) {
    return 0
  }

  const totals = dailyStats.reduce(
    (acc, stat) => {
      const reviews = stat.reviews_completed ?? 0
      const correct = (reviews * (stat.accuracy_percentage ?? 0)) / 100
      return {
        reviews: acc.reviews + reviews,
        correct: acc.correct + correct,
      }
    },
    { reviews: 0, correct: 0 }
  )

  if (totals.reviews === 0) {
    return 0
  }
  return Math.round((totals.correct / totals.reviews) * 100)
}

function getTodayStats(dailyStats: DailyStat[]) {
  const today = new Date().toISOString().split('T')[0]
  return dailyStats.find((stat) => stat.stat_date.toISOString().split('T')[0] === today)
}
