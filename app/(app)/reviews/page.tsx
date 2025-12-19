/**
 * Reviews Page
 *
 * Server-side rendered reviews page with direct DB queries.
 * Uses same resilient pattern as dashboard for reliability.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getReviewQueue } from '@/lib/db/srs-operations'
import { withCache, getCached } from '@/lib/cache/server'
import { logger } from '@/lib/utils/logger'

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

/**
 * Fetch review queue directly from database (no HTTP overhead)
 */
async function fetchReviewQueue(userId: string, limit: number = 20): Promise<ReviewItem[]> {
  const startTime = Date.now()

  const queue = await getReviewQueue(userId, limit)

  logger.info('Review queue query completed', {
    userId,
    itemCount: queue.length,
    durationMs: Date.now() - startTime,
  })

  // Transform to ReviewItem format
  return queue.map((item) => ({
    id: item.id,
    itemId: item.item_id,
    itemType: item.item_type,
    character: item.character,
    meaning: item.meaning,
    correctPinyin: item.pinyin,
  }))
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

  // Direct DB call with caching (60 second TTL)
  const cacheKey = `reviews:queue:${user.id}:20`

  let initialQueue: ReviewItem[]
  let isStale = false

  try {
    // Try to get fresh data with cache
    initialQueue = await withCache(cacheKey, () => fetchReviewQueue(user.id, 20), 60)
  } catch (error) {
    logger.error('Review queue fetch failed', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })

    // FALLBACK: Try to get stale cached data
    const cachedData = await getCached<ReviewItem[]>(cacheKey)
    if (cachedData) {
      initialQueue = cachedData
      isStale = true
      logger.info('Using stale cached data for reviews', { userId: user.id })
    } else {
      // LAST RESORT: Show error state
      return <MinimalReviews />
    }
  }

  return (
    <>
      {isStale && (
        <div className="mx-auto mb-4 max-w-2xl rounded-md bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          Showing cached data. <a href="/reviews" className="underline">Refresh</a> for latest reviews.
        </div>
      )}
      <ReviewSession initialQueue={initialQueue} />
    </>
  )
}

/**
 * Minimal reviews fallback when all data fetching fails
 */
function MinimalReviews() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-6 text-center">
        <p className="mb-4 text-muted-foreground">
          Unable to load reviews. This might be a temporary issue.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href="/reviews"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </a>
          <a
            href="/dashboard"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Back to Dashboard
          </a>
          <a
            href="/lessons"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Go to Lessons
          </a>
        </div>
      </Card>
    </div>
  )
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
