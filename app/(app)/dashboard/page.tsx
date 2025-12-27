/**
 * Dashboard Page
 *
 * Displays user's learning progress and statistics.
 * Uses direct DB queries for reliability (no internal HTTP overhead).
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { StartReviewsButton } from '@/components/ui/start-reviews-button'
import { getAuthenticatedUser } from '@/lib/supabase/get-user'
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
import { isAbortedError, safeAsync } from '@/lib/utils/request-helpers'
import { LessonsPrefetcher } from './_components/lessons-prefetcher'

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
    upcomingForecast: string[] // ISO timestamp strings for client-side timezone conversion
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
 * Dashboard header - always visible, loads immediately
 */
async function DashboardHeader({ userId }: { userId: string }) {
  // Quick check for reviews due count (lightweight query)
  const stats = await safeAsync(
    () => getDashboardStats(userId),
    {
      reviewsDue: 0,
      reviewsDueToday: 0,
      totalItemsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      stageBreakdown: [],
    },
    undefined
  )

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Track your Mandarin learning progress</p>
      </div>
      {stats.reviewsDue > 0 && <StartReviewsButton reviewsCount={stats.reviewsDue} />}
    </div>
  )
}

/**
 * Critical stats section - loads first (above the fold)
 */
async function DashboardStatsSection({ userId }: { userId: string }) {
  const cacheKey = `dashboard:stats:${userId}`

  const defaultStats: DashboardData['stats'] = {
    totalItemsLearned: 0,
    reviewsDue: 0,
    reviewsDueToday: 0,
    currentStreak: 0,
    longestStreak: 0,
    accuracyPercentage: 0,
    reviewsCompletedToday: 0,
  }

  let stats: DashboardData['stats']
  let isStale = false

  try {
    const data = await safeAsync(
      () =>
        withCache(
          cacheKey,
          async () => {
            const [overallStats, dailyStats90d, accuracyPercentage] = await Promise.all([
              getDashboardStats(userId),
              getDailyStatsRange(
                userId,
                new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                new Date()
              ),
              getAllTimeAccuracy(userId),
            ])

            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - 30)
            const dailyStats30d = dailyStats90d.filter((stat) => stat.stat_date >= cutoffDate)
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
            }
          },
          300
        ),
      { stats: defaultStats },
      undefined
    )
    stats = data.stats
  } catch (error) {
    // Try stale cache
    const cachedData = await getCached<DashboardData>(cacheKey)
    if (cachedData) {
      stats = cachedData.stats
      isStale = true
    } else {
      stats = defaultStats
    }
  }

  return (
    <>
      {isStale && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          Showing cached data.{' '}
          <a href="/dashboard" className="underline hover:text-foreground">
            Refresh
          </a>{' '}
          for latest stats.
        </div>
      )}
      <DashboardStats stats={stats} />
    </>
  )
}

/**
 * Charts section - loads second (below the fold)
 */
async function DashboardChartsSection({ userId }: { userId: string }) {
  const cacheKey = `dashboard:charts:${userId}`

  let charts: {
    reviewsOverTime: Array<{ date: string; reviews: number; newItems: number }>
    accuracyOverTime: Array<{ date: string; accuracy: number }>
    activityCalendar: Array<{ date: string; count: number }>
  }
  let isStale = false

  try {
    const data = await withCache(
      cacheKey,
      async () => {
        const [dailyStats90d] = await Promise.all([
          getDailyStatsRange(userId, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()),
        ])

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 30)
        const dailyStats30d = dailyStats90d.filter((stat) => stat.stat_date >= cutoffDate)

        return {
          reviewsOverTime: dailyStats30d.map((stat) => ({
            date: stat.stat_date.toISOString().split('T')[0] ?? '',
            reviews: stat.reviews_completed,
            newItems: stat.new_items_learned,
          })),
          accuracyOverTime: dailyStats30d.map((stat) => ({
            date: stat.stat_date.toISOString().split('T')[0] ?? '',
            accuracy: stat.accuracy_percentage,
          })),
          activityCalendar: dailyStats90d.map((stat) => ({
            date: stat.stat_date.toISOString().split('T')[0] ?? '',
            count: stat.reviews_completed,
          })),
        }
      },
      300
    )
    charts = data
  } catch (error) {
    if (isAbortedError(error)) {
      charts = {
        reviewsOverTime: [],
        accuracyOverTime: [],
        activityCalendar: [],
      }
    } else {
      const cachedData = await getCached<typeof charts>(cacheKey)
      if (cachedData) {
        charts = cachedData
        isStale = true
      } else {
        charts = {
          reviewsOverTime: [],
          accuracyOverTime: [],
          activityCalendar: [],
        }
      }
    }
  }

  return (
    <>
      {isStale && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          Showing cached charts.{' '}
          <a href="/dashboard" className="underline hover:text-foreground">
            Refresh
          </a>{' '}
          for latest data.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <ReviewsChart data={charts.reviewsOverTime} />
        <AccuracyChart data={charts.accuracyOverTime} />
      </div>
      <ActivityCalendar data={charts.activityCalendar} />
    </>
  )
}

/**
 * Secondary content section - loads last (lowest priority)
 */
async function DashboardSecondarySection({ userId }: { userId: string }) {
  const cacheKey = `dashboard:secondary:${userId}`

  let lessons: DashboardData['lessons']
  let upcomingForecast: string[]
  let isStale = false

  try {
    const data = await withCache(
      cacheKey,
      async () => {
        const [lessonProgress, forecast] = await Promise.all([
          getUserLessonProgress(userId),
          getUpcomingReviewsForecast(userId),
        ])

        return {
          lessons: lessonProgress.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            isCompleted: lesson.isCompleted,
            isUnlocked: lesson.isUnlocked,
          })),
          upcomingForecast: forecast,
        }
      },
      300
    )
    lessons = data.lessons
    upcomingForecast = data.upcomingForecast
  } catch (error) {
    if (isAbortedError(error)) {
      lessons = []
      upcomingForecast = []
    } else {
      const cachedData = await getCached<{
        lessons: DashboardData['lessons']
        upcomingForecast: string[]
      }>(cacheKey)
      if (cachedData) {
        lessons = cachedData.lessons
        upcomingForecast = cachedData.upcomingForecast
        isStale = true
      } else {
        lessons = []
        upcomingForecast = []
      }
    }
  }

  return (
    <>
      {isStale && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          Showing cached data.{' '}
          <a href="/dashboard" className="underline hover:text-foreground">
            Refresh
          </a>{' '}
          for latest.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <LessonProgress lessons={lessons} />
        <UpcomingReviews forecast={upcomingForecast} />
      </div>
    </>
  )
}

/**
 * Dashboard content with progressive loading
 *
 * Uses multiple Suspense boundaries for progressive rendering:
 * 1. Header (immediate)
 * 2. Stats (critical, above fold)
 * 3. Charts (secondary, below fold)
 * 4. Secondary content (tertiary, lowest priority)
 *
 * Handles aborted requests gracefully to prevent errors during navigation.
 */
async function DashboardContent() {
  // Get user - middleware has validated, but handle null gracefully
  const user = await getAuthenticatedUser()

  // If user is null, they either aren't authenticated or request was aborted
  // Redirect to login as safety net (middleware should have caught this)
  if (!user) {
    redirect('/login?redirectTo=/dashboard')
  }

  // Check if profile exists, create if not (safety net)
  let profile
  try {
    profile = await getUserProfile(user.id)
  } catch (error) {
    // If request was aborted, show minimal dashboard instead of error
    if (isAbortedError(error)) {
      return <MinimalDashboard />
    }
    throw error
  }

  if (!profile) {
    logger.info('Creating missing profile for user', { userId: user.id })

    try {
      await createUserProfile(user.id, user.email || '')
    } catch (createError) {
      // If aborted, show minimal dashboard
      if (isAbortedError(createError)) {
        return <MinimalDashboard />
      }

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

  // Check if user has incomplete lessons (likely to visit lessons page)
  // This is a lightweight check for prefetching decision
  let hasIncompleteLessons = false
  try {
    const lessonProgress = await safeAsync(() => getUserLessonProgress(user.id), [], undefined)
    hasIncompleteLessons = lessonProgress.some((lesson) => !lesson.isCompleted)
  } catch {
    // Silently fail - prefetch decision is optional
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header - loads immediately */}
      <DashboardHeader userId={user.id} />

      {/* Critical stats - loads first (above the fold) */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsSection userId={user.id} />
      </Suspense>

      {/* Charts - loads second (below the fold) */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardChartsSection userId={user.id} />
      </Suspense>

      {/* Secondary content - loads last (lowest priority) */}
      <Suspense fallback={<SecondarySkeleton />}>
        <DashboardSecondarySection userId={user.id} />
      </Suspense>

      {/* Lessons prefetcher - runs in background after dashboard loads */}
      {hasIncompleteLessons && <LessonsPrefetcher hasIncompleteLessons={hasIncompleteLessons} />}
    </div>
  )
}

/**
 * Minimal dashboard fallback when all data fetching fails
 */
function MinimalDashboard() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Track your Mandarin learning progress</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-soft-md">
        <p className="mb-6 text-muted-foreground">
          Unable to load dashboard data. This might be a temporary issue.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-base hover:opacity-90 active:scale-95"
          >
            Try Again
          </a>
          <a
            href="/lessons"
            className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium transition-all duration-base hover:bg-muted"
          >
            Go to Lessons
          </a>
          <a
            href="/reviews"
            className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium transition-all duration-base hover:bg-muted"
          >
            Start Reviews
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <VerificationSuccess />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-[400px] animate-pulse rounded-xl border border-border bg-muted" />
}

function CalendarSkeleton() {
  return <div className="h-[220px] animate-pulse rounded-xl border border-border bg-muted" />
}

function WidgetSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-xl border border-border bg-muted" />
}

/**
 * Skeleton for stats section (critical, above fold)
 */
function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-muted" />
      ))}
    </div>
  )
}

/**
 * Skeleton for charts section (secondary, below fold)
 */
function ChartsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <CalendarSkeleton />
    </>
  )
}

/**
 * Skeleton for secondary content (tertiary, lowest priority)
 */
function SecondarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6">
      <WidgetSkeleton />
      <WidgetSkeleton />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="mb-8">
        <div className="mb-2 h-9 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-64 animate-pulse rounded-lg bg-muted" />
      </div>

      <StatsSkeleton />
      <ChartsSkeleton />
      <SecondarySkeleton />
    </div>
  )
}
