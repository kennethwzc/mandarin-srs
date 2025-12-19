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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:41',message:'GET dashboard stats - entry',data:{envCheck:{supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,20),hasAnonKey:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,hasDatabaseUrl:!!process.env.DATABASE_URL,hasServiceKey:!!process.env.SUPABASE_SERVICE_ROLE_KEY,skipValidation:process.env.SKIP_ENV_VALIDATION}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const supabase = createClient()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:43',message:'Supabase client created',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:47',message:'Auth result',data:{hasUser:!!user,userId:user?.id,authError:authError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion

    if (authError || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:49',message:'AUTH FAILED - returning 401',data:{authError:authError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile exists, create if not (safety net)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:52',message:'Checking profile',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion
    const profile = await getUserProfile(user.id)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:54',message:'Profile check result',data:{hasProfile:!!profile,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion

    if (!profile) {
      logger.info('Creating missing profile for user', { userId: user.id })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:57',message:'Profile missing - attempting creation',data:{userId:user.id,email:user.email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      try {
        await createUserProfile(user.id, user.email || '')
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:60',message:'Profile created successfully',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } catch (createError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:62',message:'PROFILE CREATION FAILED - returning 404',data:{userId:user.id,error:createError instanceof Error?createError.message:String(createError),stack:createError instanceof Error?createError.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:85',message:'Starting cache fetch',data:{cacheKey,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D,E'})}).catch(()=>{});
    // #endregion

    const cachedData = await withCache(
      cacheKey,
      async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:89',message:'Cache miss - executing queries',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D,E'})}).catch(()=>{});
        // #endregion
        // Calculate date ranges
        const endDate = new Date()
        const startDate90Days = new Date()
        startDate90Days.setDate(startDate90Days.getDate() - 90)

        // PARALLEL EXECUTION: Run ALL independent queries at once
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:96',message:'Starting parallel queries',data:{userId:user.id,startDate:startDate90Days.toISOString(),endDate:endDate.toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
        const [overallStats, dailyStats90d, lessonProgress, upcomingForecast, accuracyPercentage] =
          await Promise.all([
            getDashboardStats(user.id),
            getDailyStatsRange(user.id, startDate90Days, endDate), // Single 90-day query
            getUserLessonProgress(user.id),
            getUpcomingReviewsForecast(user.id),
            getAllTimeAccuracy(user.id),
          ])
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:103',message:'Queries completed',data:{userId:user.id,overallStats:{totalItemsLearned:overallStats.totalItemsLearned,reviewsDue:overallStats.reviewsDue},dailyStatsCount:dailyStats90d.length,lessonCount:lessonProgress.length,forecastCount:upcomingForecast.length,accuracy:accuracyPercentage},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:176',message:'Cache returned - sending response',data:{hasCachedData:!!cachedData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      success: true,
      data: cachedData,
    })
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbc3e05a-210b-455f-828b-483287dd0720',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/stats/route.ts:184',message:'CATCH-ALL ERROR HANDLER - returning 500',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined,name:error instanceof Error?error.name:undefined},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D,E'})}).catch(()=>{});
    // #endregion
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
