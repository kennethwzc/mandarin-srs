import { Suspense } from 'react'
import { cookies } from 'next/headers'
import dynamic from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { StartReviewsButton } from '@/components/ui/start-reviews-button'
import { createClient } from '@/lib/supabase/server'

// Lazy load client components to avoid SSR issues in CI
const DashboardStats = dynamic(
  () =>
    import('@/components/features/dashboard-stats').then((m) => ({
      default: m.DashboardStats,
    })),
  { ssr: false }
)

// Lazy load heavy chart components for better performance
// All charts use recharts which has SSR issues, so disable SSR
const ReviewsChart = dynamic(
  () =>
    import('@/components/features/reviews-chart').then((m) => ({
      default: m.ReviewsChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const AccuracyChart = dynamic(
  () =>
    import('@/components/features/accuracy-chart').then((m) => ({
      default: m.AccuracyChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const ActivityCalendar = dynamic(
  () =>
    import('@/components/features/activity-calendar').then((m) => ({
      default: m.ActivityCalendar,
    })),
  { ssr: false, loading: () => <CalendarSkeleton /> }
)

const LessonProgress = dynamic(
  () =>
    import('@/components/features/lesson-progress').then((m) => ({
      default: m.LessonProgress,
    })),
  { loading: () => <WidgetSkeleton /> }
)

const UpcomingReviews = dynamic(
  () =>
    import('@/components/features/upcoming-reviews').then((m) => ({
      default: m.UpcomingReviews,
    })),
  { loading: () => <WidgetSkeleton /> }
)

export const metadata = {
  title: 'Dashboard',
  description: 'View your learning progress and statistics',
}

async function DashboardContent() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    )
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const cookieHeader = cookies()
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: 'no-store',
  })

  if (!response.ok) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  const { data } = await response.json()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track your Mandarin learning progress</p>
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
    <div className="container mx-auto px-4 py-8">
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
