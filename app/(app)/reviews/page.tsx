/**
 * Reviews Page
 *
 * Server-side rendered reviews page that fetches review queue during SSR.
 * This eliminates the client-side fetch waterfall for faster initial load.
 */

import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

// Dynamic import for the client component to avoid SSR issues
const ReviewSession = dynamicImport(
  () =>
    import('@/components/features/review-session').then((m) => ({
      default: m.ReviewSession,
    })),
  { ssr: false, loading: () => <ReviewSessionSkeleton /> }
)

export const metadata = {
  title: 'Reviews',
  description: 'Practice typing pinyin for your scheduled reviews',
}

export const dynamic = 'force-dynamic'

/**
 * Review item data structure matching the API response
 */
interface ReviewQueueItem {
  id: string
  item_id: number
  item_type: 'radical' | 'character' | 'vocabulary'
  character: string
  pinyin: string
  meaning: string
}

/**
 * Transformed review item for the ReviewSession component
 */
interface ReviewItem {
  id: string
  itemId: number
  itemType: 'radical' | 'character' | 'vocabulary'
  character: string
  meaning: string
  correctPinyin: string
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

function getCookieHeader() {
  return cookies()
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}

/**
 * Server component that fetches review queue data during SSR
 */
async function ReviewsContent() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (authError || !user) {
    redirect('/login?redirectTo=/reviews')
  }

  const baseUrl = getBaseUrl()
  const cookieHeader = getCookieHeader()

  // Add timeout to prevent long waits
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

  let response
  try {
    response = await fetch(`${baseUrl}/api/reviews/queue?limit=20`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      return (
        <div className="space-y-4 py-12 text-center">
          <h2 className="text-xl font-semibold">Loading Reviews...</h2>
          <p className="text-muted-foreground">
            This is taking longer than expected. Please wait a moment.
          </p>
          <a
            href="/dashboard"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Dashboard
          </a>
        </div>
      )
    }
    throw error
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    let errorMessage = 'Failed to load reviews'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // Response might not be JSON
    }

    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{errorMessage}</p>
        <a
          href="/dashboard"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Dashboard
        </a>
      </div>
    )
  }

  const { data } = await response.json()

  // Transform API data to ReviewItem format
  const initialQueue: ReviewItem[] = (data.queue || []).map((item: ReviewQueueItem) => ({
    id: item.id,
    itemId: item.item_id,
    itemType: item.item_type,
    character: item.character,
    meaning: item.meaning,
    correctPinyin: item.pinyin,
  }))

  return <ReviewSession initialQueue={initialQueue} />
}

export default function ReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Type the correct pinyin with tone marks</p>
      </div>

      <Suspense fallback={<ReviewSessionSkeleton />}>
        <ReviewsContent />
      </Suspense>
    </div>
  )
}

/**
 * Skeleton loading state for the review session
 */
function ReviewSessionSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
      </div>

      {/* Review card skeleton */}
      <Card className="p-6 sm:p-8">
        <div className="space-y-6">
          {/* Character display */}
          <div className="text-center">
            <div className="mx-auto mb-4 h-24 w-24 animate-pulse rounded-lg bg-muted sm:h-32 sm:w-32" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
          </div>

          {/* Input area */}
          <div className="space-y-4">
            <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="flex justify-center">
              <div className="h-12 w-32 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats skeleton */}
      <div className="flex justify-center gap-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
