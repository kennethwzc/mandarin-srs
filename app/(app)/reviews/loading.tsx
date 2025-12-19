/**
 * Reviews Loading State
 *
 * Displayed during Next.js route navigation to /reviews.
 * Provides a skeleton UI while the page is loading.
 */

import { Card } from '@/components/ui/card'

export default function ReviewsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Type the correct pinyin with tone marks</p>
      </div>

      {/* Review Session Skeleton */}
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
    </div>
  )
}
