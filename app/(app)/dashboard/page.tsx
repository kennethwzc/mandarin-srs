/**
 * Dashboard Page
 *
 * Displays user's learning progress and statistics.
 * Uses direct DB queries for reliability (no internal HTTP overhead).
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { StartReviewsButton } from '@/components/ui/start-reviews-button'
import { createClient } from '@/lib/supabase/server'
import { VerificationSuccess } from './_components/verification-success'
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
import { withCache, getCached } from '@/lib/cache/server'
import { logger } from '@/lib/utils/logger'

type DailyStat = typeof schema.dailyStats.$inferSelect

// Lazy load client components to avoid SSR issues in CI
const DashboardStats = dynamicImport(
  () =>
    import('@/components/features/dashboard-stats').then((m) => ({
      default: m.DashboardStats,
    })),
  { ssr: false }
)

// Lazy load heavy chart components for better performance
// All charts use recharts which has SSR issues, so disable SSR
const ReviewsChart = dynamicImport(
  () =>
    import('@/components/features/reviews-chart').then((m) => ({
      default: m.ReviewsChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const AccuracyChart = dynamicImport(
  () =>
    import('@/components/features/accuracy-chart').then((m) => ({
      default: m.AccuracyChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const ActivityCalendar = dynamicImport(
  () =>
    import('@/components/features/activity-calendar').then((m) => ({
      default: m.ActivityCalendar,
    })),
  { ssr: false, loading: () => <CalendarSkeleton /> }
)

const LessonProgress = dynamicImport(
  () =>
    import('@/components/features/lesson-progress').then((m) => ({
      default: m.LessonProgress,
    })),
  { ssr: false, loading: () => <WidgetSkeleton /> }
)

const UpcomingReviews = dynamicImport(
  () =>
    import('@/components/features/upcoming-reviews').then((m) => ({
      default: m.UpcomingReviews,
    })),
  { ssr: false, loading: () => <WidgetSkeleton /> }
)

const StreakDisplay = dynamicImport(
  () =>
    import('@/components/features/streak-display').then((m) => ({
      default: m.StreakDisplay,
    })),
  { ssr: false, loading: () => <StreakSkeleton /> }
)

export const metadata = {
  title: 'Dashboard',
  description: 'View your learning progress and statistics',
}

export const dynamic = 'force-dynamic'

/**
 * Dashboard data structure
 */
interface DashboardData {
  stats: {
    totalItemsLearned: number
    reviewsDue: number
    reviewsDueToday: number
    currentStreak: number
    longestStreak: number
    accuracyPercentage: number
    reviewsCompletedToday: number
  }
  charts: {
    reviewsOverTime: Array<{ date: string; reviews: number; newItems: number }>
    accuracyOverTime: Array<{ date: string; accuracy: number }>
    activityCalendar: Array<{ date: string; count: number }>
    upcomingForecast: Array<{ hour: number; count: number }>
  }
  lessons: Array<{
    id: number
    title: string
    isCompleted: boolean
    isUnlocked: boolean
  }>
}

/**
 * Get today's stats from daily stats array
 */
function getTodayStats(dailyStats: DailyStat[]) {
  const today = new Date().toISOString().split('T')[0] ?? ''
  return dailyStats.find((stat) => (stat.stat_date.toISOString().split('T')[0] ?? '') === today)
}

/**
 * Fetch dashboard data directly from database (no HTTP overhead)
 */
async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const startTime = Date.now()

  // Calculate date ranges
  const endDate = new Date()
  const startDate90Days = new Date()
  startDate90Days.setDate(startDate90Days.getDate() - 90)

  // PARALLEL EXECUTION: Run ALL independent queries at once
  const [overallStats, dailyStats90d, lessonProgress, upcomingForecast, accuracyPercentage] =
    await Promise.all([
      getDashboardStats(userId),
      getDailyStatsRange(userId, startDate90Days, endDate),
      getUserLessonProgress(userId),
      getUpcomingReviewsForecast(userId),
      getAllTimeAccuracy(userId),
    ])

  logger.info('Dashboard queries completed', {
    userId,
    durationMs: Date.now() - startTime,
  })

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
    date: stat.stat_date.toISOString().split('T')[0] ?? '',
    reviews: stat.reviews_completed,
    newItems: stat.new_items_learned,
  }))

  const accuracyOverTime = dailyStats30d.map((stat) => ({
    date: stat.stat_date.toISOString().split('T')[0] ?? '',
    accuracy: stat.accuracy_percentage,
  }))

  const activityCalendar = dailyStats90d.map((stat) => ({
    date: stat.stat_date.toISOString().split('T')[0] ?? '',
    count: stat.reviews_completed,
  }))

  const reviewsCompletedToday = getTodayStats(dailyStats30d)?.reviews_completed ?? 0

  return {
    stats: {
      totalItemsLearned: overallStats.totalItemsLearned,
      reviewsDue: overallStats.reviewsDue,
      reviewsDueToday: overallStats.reviewsDueToday,
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
}

/**
 * Dashboard content with direct DB calls and fallback support
 */
async function DashboardContent() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (authError || !user) {
    redirect('/login?redirectTo=/dashboard')
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

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold">Account Setup Incomplete</h2>
            <p className="mb-4 text-muted-foreground">
              Your account was created but your profile needs to be set up.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Please try refreshing the page or contact support if this issue persists.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a
                href="/dashboard"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Refresh Page
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  // Direct DB calls with caching (5 min TTL)
  const cacheKey = `dashboard:stats:${user.id}`

  let data: DashboardData
  let isStale = false

  try {
    // Try to get fresh data with cache
    data = await withCache(cacheKey, () => fetchDashboardData(user.id), 300)
  } catch (error) {
    logger.error('Dashboard data fetch failed', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })

    // FALLBACK: Try to get stale cached data
    const cachedData = await getCached<DashboardData>(cacheKey)
    if (cachedData) {
      data = cachedData
      isStale = true
      logger.info('Using stale cached data for dashboard', { userId: user.id })
    } else {
      // LAST RESORT: Return minimal dashboard
      return <MinimalDashboard />
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {isStale && (
        <div className="rounded-md bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          Showing cached data. <a href="/dashboard" className="underline">Refresh</a> for latest stats.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track your Mandarin learning progress
          </p>
        </div>
        {data.stats.reviewsDue > 0 && <StartReviewsButton reviewsCount={data.stats.reviewsDue} />}
      </div>

      <DashboardStats stats={data.stats} />

      <StreakDisplay
        currentStreak={data.stats.currentStreak}
        longestStreak={data.stats.longestStreak}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ReviewsChart data={data.charts.reviewsOverTime} />
        <AccuracyChart data={data.charts.accuracyOverTime} />
      </div>

      <ActivityCalendar data={data.charts.activityCalendar} />

      <div className="grid gap-4 md:grid-cols-2">
        <LessonProgress lessons={data.lessons} />
        <UpcomingReviews
          forecast={data.charts.upcomingForecast}
          currentHour={new Date().getHours()}
        />
      </div>
    </div>
  )
}

/**
 * Minimal dashboard fallback when all data fetching fails
 */
function MinimalDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Track your Mandarin learning progress
        </p>
      </div>

      <Card className="p-6 text-center">
        <p className="mb-4 text-muted-foreground">
          Unable to load dashboard data. This might be a temporary issue.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </a>
          <a
            href="/lessons"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Go to Lessons
          </a>
          <a
            href="/reviews"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Start Reviews
          </a>
        </div>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
      <VerificationSuccess />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
}

function CalendarSkeleton() {
  return <Card className="h-[220px] animate-pulse bg-muted" />
}

function WidgetSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
}

function StreakSkeleton() {
  return <div className="h-[100px] animate-pulse rounded-lg bg-muted" />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>

      <StreakSkeleton />

      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      <CalendarSkeleton />

      <div className="grid gap-4 md:grid-cols-2">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
    </div>
  )
}
