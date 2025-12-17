import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { StartReviewsButton } from '@/components/ui/start-reviews-button'
import { createClient } from '@/lib/supabase/server'
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

async function DashboardContent() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should never happen due to middleware, but redirect just in case
    redirect('/login')
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const cookieHeader = cookies()
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  // Add timeout to prevent long waits
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

  let response
  try {
    response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout occurred - show helpful message
      return (
        <div className="space-y-4 py-12 text-center">
          <h2 className="text-xl font-semibold">Dashboard is Loading...</h2>
          <p className="text-muted-foreground">
            This is taking longer than expected. Your account is being set up.
          </p>
          <p className="text-sm text-muted-foreground">
            Please refresh the page in a moment, or try the simplified view:
          </p>
          <a
            href="/lessons"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Lessons
          </a>
        </div>
      )
    }
    throw error
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    // Try to get error details
    let errorMessage = 'Failed to load dashboard data'
    let errorCode: string | null = null

    try {
      const errorData = await response.json()
      errorCode = errorData.errorCode
      errorMessage = errorData.error || errorMessage
    } catch {
      // Response might not be JSON
    }

    // Show specific error for profile not found
    if (errorCode === 'PROFILE_NOT_FOUND') {
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
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Generic error message
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
    )
  }

  const { data } = await response.json()

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track your Mandarin learning progress
          </p>
        </div>
        {data.stats.reviewsDueToday > 0 && (
          <StartReviewsButton reviewsCount={data.stats.reviewsDueToday} />
        )}
      </div>

      <DashboardStats stats={data.stats} />

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
