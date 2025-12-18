/**
 * Dashboard Page - Progressive Rendering
 *
 * Uses React Server Components streaming for fast initial paint.
 * Each section loads independently and streams as data becomes available.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { StartReviewsButton } from '@/components/ui/start-reviews-button'
import { createClient } from '@/lib/supabase/server'
import {
  getDashboardStats,
  getDailyStatsRange,
  getUserLessonProgress,
  getUpcomingReviewsForecast,
  getAllTimeAccuracy,
} from '@/lib/db/queries'
import { VerificationSuccess } from './_components/verification-success'

// Lazy load client components to avoid SSR issues in CI
const DashboardStats = dynamicImport(
  () =>
    import('@/components/features/dashboard-stats').then((m) => ({
      default: m.DashboardStats,
    })),
  { ssr: false }
)

// Lazy load heavy chart components for better performance
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

// ============================================================================
// STREAMING SERVER COMPONENTS
// Each section queries DB directly and streams independently
// ============================================================================

/**
 * Quick Stats Section - FAST (200-500ms)
 * Shows total items, reviews due, streak
 */
async function QuickStatsSection({ userId }: { userId: string }) {
  const [overallStats, accuracyPercentage, dailyStats] = await Promise.all([
    getDashboardStats(userId),
    getAllTimeAccuracy(userId),
    getDailyStatsRange(userId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
  ])

  const today = new Date().toISOString().split('T')[0]
  const todayStats = dailyStats.find((stat) => stat.stat_date.toISOString().split('T')[0] === today)
  const reviewsCompletedToday = todayStats?.reviews_completed ?? 0

  const stats = {
    totalItemsLearned: overallStats.totalItemsLearned,
    reviewsDueToday: overallStats.reviewsDueToday ?? overallStats.reviewsDue,
    currentStreak: overallStats.currentStreak,
    longestStreak: overallStats.longestStreak,
    accuracyPercentage,
    reviewsCompletedToday,
  }

  return (
    <>
      {stats.reviewsDueToday > 0 && (
        <div className="mb-4">
          <StartReviewsButton reviewsCount={stats.reviewsDueToday} />
        </div>
      )}
      <DashboardStats stats={stats} />
    </>
  )
}

/**
 * Charts Section - MEDIUM (500ms-1s)
 * Shows 30-day reviews and accuracy charts
 */
async function ChartsSection({ userId }: { userId: string }) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 30)

  const dailyStats = await getDailyStatsRange(userId, startDate, endDate)

  const reviewsOverTime = dailyStats.map((stat) => ({
    date: stat.stat_date.toISOString().split('T')[0],
    reviews: stat.reviews_completed,
    newItems: stat.new_items_learned,
  }))

  const accuracyOverTime = dailyStats.map((stat) => ({
    date: stat.stat_date.toISOString().split('T')[0],
    accuracy: stat.accuracy_percentage,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ReviewsChart data={reviewsOverTime} />
      <AccuracyChart data={accuracyOverTime} />
    </div>
  )
}

/**
 * Activity Section - SLOWER (1-2s)
 * Shows 90-day activity calendar
 */
async function ActivitySection({ userId }: { userId: string }) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 90)

  const dailyStats = await getDailyStatsRange(userId, startDate, endDate)

  const activityCalendar = dailyStats.map((stat) => ({
    date: stat.stat_date.toISOString().split('T')[0],
    count: stat.reviews_completed,
  }))

  return <ActivityCalendar data={activityCalendar} />
}

/**
 * Lessons & Forecast Section - SLOWEST (2-3s)
 * Shows lesson progress and upcoming reviews forecast
 */
async function LessonsAndForecastSection({ userId }: { userId: string }) {
  const [lessonProgress, upcomingForecast] = await Promise.all([
    getUserLessonProgress(userId),
    getUpcomingReviewsForecast(userId),
  ])

  const lessons = lessonProgress.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    isCompleted: lesson.isCompleted,
    isUnlocked: lesson.isUnlocked,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <LessonProgress lessons={lessons} />
      <UpcomingReviews forecast={upcomingForecast} currentHour={new Date().getHours()} />
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
      <VerificationSuccess />

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Track your Mandarin learning progress
            </p>
          </div>
        </div>

        {/* Quick Stats - Streams first (200-500ms) */}
        <Suspense fallback={<QuickStatsSkeleton />}>
          <QuickStatsSection userId={user.id} />
        </Suspense>

        {/* Charts - Streams second (500ms-1s) */}
        <Suspense fallback={<ChartsSkeleton />}>
          <ChartsSection userId={user.id} />
        </Suspense>

        {/* Activity Calendar - Streams third (1-2s) */}
        <Suspense fallback={<CalendarSkeleton />}>
          <ActivitySection userId={user.id} />
        </Suspense>

        {/* Lessons & Forecast - Streams last (2-3s) */}
        <Suspense fallback={<LessonsAndForecastSkeleton />}>
          <LessonsAndForecastSection userId={user.id} />
        </Suspense>
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function ChartSkeleton() {
  return <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
}

function CalendarSkeleton() {
  return <Card className="h-[220px] animate-pulse bg-muted" />
}

function WidgetSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
}

function QuickStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  )
}

function LessonsAndForecastSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <WidgetSkeleton />
      <WidgetSkeleton />
    </div>
  )
}
