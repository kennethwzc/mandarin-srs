'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { ReviewCard } from './review-card'
import type { ReviewResult } from './review-card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * Review Session Manager
 *
 * Manages a review session:
 * - Fetches review queue from API
 * - Shows cards one by one
 * - Submits answers to API
 * - Tracks progress
 * - Shows completion screen
 */

interface ReviewItem {
  id: string
  itemId: number
  itemType: 'radical' | 'character' | 'vocabulary'
  character: string
  meaning: string
  correctPinyin: string
}

export function ReviewSession() {
  const router = useRouter()

  // State
  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  // Stats
  const [correctCount, setCorrectCount] = useState(0)
  const [totalReviewed, setTotalReviewed] = useState(0)

  // Fetch review queue on mount
  useEffect(() => {
    fetchReviewQueue()
  }, [])

  /**
   * Fetch review queue from API
   */
  async function fetchReviewQueue() {
    setIsLoading(true)

    try {
      const response = await fetch('/api/reviews/queue?limit=20')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      // Transform API data to ReviewItem format with actual content
      const items: ReviewItem[] = data.data.queue.map(
        (item: {
          id: string
          item_id: number
          item_type: 'radical' | 'character' | 'vocabulary'
          character: string
          pinyin: string
          meaning: string
        }) => ({
          id: item.id,
          itemId: item.item_id,
          itemType: item.item_type,
          character: item.character,
          meaning: item.meaning,
          correctPinyin: item.pinyin,
        })
      )

      setQueue(items)

      if (items.length === 0) {
        setSessionComplete(true)
      }
    } catch (error) {
      console.error('Error fetching review queue:', error)
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Submit review result to API
   */
  async function handleSubmitReview(result: ReviewResult) {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const currentItem = queue[currentIndex]

      if (!currentItem) {
        return
      }

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: currentItem.itemId,
          itemType: currentItem.itemType,
          userAnswer: result.userAnswer,
          correctAnswer: currentItem.correctPinyin,
          grade: result.grade,
          responseTimeMs: result.responseTimeMs,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Update stats
      setTotalReviewed((prev) => prev + 1)
      if (result.isCorrect) {
        setCorrectCount((prev) => prev + 1)
      }

      // Move to next card
      const nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        setSessionComplete(true)
      } else {
        setCurrentIndex(nextIndex)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle skip (optional)
   */
  function handleSkip() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) {
      setSessionComplete(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  // Session complete
  if (sessionComplete) {
    const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0
    const hasCompletedReviews = totalReviewed > 0

    return (
      <div className="mx-auto max-w-2xl space-y-6 p-8 text-center">
        <div className="mb-4 text-6xl">{hasCompletedReviews ? '🎉' : '📚'}</div>
        <h1 className="text-3xl font-bold">
          {hasCompletedReviews ? 'Session Complete!' : 'No Reviews Due'}
        </h1>

        {hasCompletedReviews ? (
          <>
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="text-3xl font-bold text-primary">{totalReviewed}</div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Great work! Come back later for more reviews, or start a new lesson.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            You&apos;re all caught up! Start a new lesson to learn more items.
          </p>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          <Button variant="outline" onClick={() => router.push('/lessons')}>
            Browse Lessons
          </Button>
        </div>
      </div>
    )
  }

  const currentItem = queue[currentIndex]
  const progress = ((currentIndex + 1) / queue.length) * 100

  if (!currentItem) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No reviews available</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="mx-auto max-w-2xl space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          aria-label={`Review progress: ${currentIndex + 1} of ${queue.length} items`}
        />
      </div>

      {/* Review card */}
      <ReviewCard
        key={currentItem.id} // Force remount on each item change
        character={currentItem.character}
        meaning={currentItem.meaning}
        correctPinyin={currentItem.correctPinyin}
        itemType={currentItem.itemType}
        onSubmit={handleSubmitReview}
        onSkip={handleSkip}
      />

      {/* Session stats */}
      <div className="mx-auto flex max-w-2xl justify-center gap-4 text-sm text-muted-foreground">
        <span>✓ {correctCount} correct</span>
        <span>• {totalReviewed} total</span>
        {totalReviewed > 0 && (
          <span>• {Math.round((correctCount / totalReviewed) * 100)}% accuracy</span>
        )}
      </div>
    </div>
  )
}
