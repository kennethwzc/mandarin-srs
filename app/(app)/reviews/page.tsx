import { Suspense } from 'react'

import { ReviewSession } from '@/components/features/review-session'

export const metadata = {
  title: 'Reviews',
  description: 'Practice typing pinyin for your scheduled reviews',
}

export default function ReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Type the correct pinyin with tone marks</p>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        }
      >
        <ReviewSession />
      </Suspense>
    </div>
  )
}
