/**
 * Dashboard Page with Progressive Loading
 *
 * Performance optimizations:
 * 1. Quick stats load first (<500ms)
 * 2. Charts and widgets load progressively with Suspense
 * 3. Each section can fail independently without breaking others
 * 4. Skeletons show immediately for perceived performance
 */

import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { StartReviewsButton } from '@/components/ui/start-reviews-button'
import { createClient } from '@/lib/supabase/server'
import { VerificationSuccess } from './_components/verification-success'

// Lazy load client components to avoid SSR issues
const DashboardStats = dynamicImport(
  () =>
    import('@/components/features/dashboard-stats').then((m) => ({
      default: m.DashboardStats,
    })),
  { ssr: false }
)

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

// Helper to build base URL
function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

// Helper to get cookie header
function getCookieHeader() {
  return cookies()
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}

/**
 * Quick Stats Section - Loads first for immediate feedback
 */
async function QuickStatsSection() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const baseUrl = getBaseUrl()
  const cookieHeader = getCookieHeader()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout for quick stats

    const response = await fetch(`${baseUrl}/api/dashboard/quick-stats`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch quick stats')
    }

    const { data } = await response.json()

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Track your Mandarin learning progress
            </p>
          </div>
          {data.reviewsDueToday > 0 && (
            <StartReviewsButton reviewsCount={data.reviewsDueToday} />
          )}
        </div>

        <DashboardStats
          stats={{
            ...data,
            reviewsCompletedToday: 0, // Will be updated when full data loads
          }}
        />
      </>
    )
  } catch {
    // Return minimal header on error
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track your Mandarin learning progress
          </p>
        </div>
      </div>
    )
  }
}

/**
 * Charts Section - Loads after quick stats
 */
async function ChartsSection() {
  const baseUrl = getBaseUrl()
  const cookieHeader = getCookieHeader()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch charts data')
    }

    const { data } = await response.json()

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ReviewsChart data={data.charts.reviewsOverTime} />
        <AccuracyChart data={data.charts.accuracyOverTime} />
      </div>
    )
  } catch {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Charts temporarily unavailable</p>
        </Card>
        <Card className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Charts temporarily unavailable</p>
        </Card>
      </div>
    )
  }
}

/**
 * Activity Calendar Section
 */
async function ActivitySection() {
  const baseUrl = getBaseUrl()
  const cookieHeader = getCookieHeader()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch activity data')
    }

    const { data } = await response.json()

    return <ActivityCalendar data={data.charts.activityCalendar} />
  } catch {
    return (
      <Card className="flex h-[220px] items-center justify-center">
        <p className="text-muted-foreground">Activity calendar temporarily unavailable</p>
      </Card>
    )
  }
}

/**
 * Lessons and Upcoming Reviews Section
 */
async function LessonsAndForecastSection() {
  const baseUrl = getBaseUrl()
  const cookieHeader = getCookieHeader()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch lessons data')
    }

    const { data } = await response.json()

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <LessonProgress lessons={data.lessons} />
        <UpcomingReviews
          forecast={data.charts.upcomingForecast}
          currentHour={new Date().getHours()}
        />
      </div>
    )
  } catch {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Lessons temporarily unavailable</p>
        </Card>
        <Card className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Forecast temporarily unavailable</p>
        </Card>
      </div>
    )
  }
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
      <VerificationSuccess />

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Quick Stats - Loads first for immediate feedback */}
        <Suspense fallback={<QuickStatsSkeleton />}>
          <QuickStatsSection />
        </Suspense>

        {/* Charts - Load progressively */}
        <Suspense fallback={<ChartsSectionSkeleton />}>
          <ChartsSection />
        </Suspense>

        {/* Activity Calendar */}
        <Suspense fallback={<CalendarSkeleton />}>
          <ActivitySection />
        </Suspense>

        {/* Lessons and Forecast */}
        <Suspense fallback={<LessonsAndForecastSkeleton />}>
          <LessonsAndForecastSection />
        </Suspense>
      </div>
    </div>
  )
}

// Skeleton Components
function QuickStatsSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </>
  )
}

function ChartSkeleton() {
  return <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
}

function ChartsSectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  )
}

function CalendarSkeleton() {
  return <Card className="h-[220px] animate-pulse bg-muted" />
}

function WidgetSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
}

function LessonsAndForecastSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <WidgetSkeleton />
      <WidgetSkeleton />
    </div>
  )
}
