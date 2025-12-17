'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
 * - Submits answers to API (optimistically - non-blocking)
 * - Tracks progress
 * - Shows completion screen
 *
 * Performance optimizations:
 * - Optimistic UI: Card advances immediately, API submits in background
 * - Memoized callbacks: Prevents unnecessary re-renders
 * - Submission queue: Handles rapid keypresses without blocking
 */

interface ReviewItem {
  id: string
  itemId: number
  itemType: 'radical' | 'character' | 'vocabulary'
  character: string
  meaning: string
  correctPinyin: string
}

interface PendingSubmission {
  itemId: number
  itemType: 'radical' | 'character' | 'vocabulary'
  userAnswer: string
  correctAnswer: string
  grade: number
  responseTimeMs: number
  isCorrect: boolean
}

export function ReviewSession() {
  const router = useRouter()

  // State
  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)

  // Stats
  const [correctCount, setCorrectCount] = useState(0)
  const [totalReviewed, setTotalReviewed] = useState(0)

  // Refs for optimistic UI
  const pendingSubmissions = useRef<PendingSubmission[]>([])
  const isProcessingQueue = useRef(false)
  const hasAdvancedRef = useRef(false) // Prevent double-advance on rapid keypresses

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
   * Process pending submissions in background
   * Handles the queue of API submissions without blocking UI
   */
  const processSubmissionQueue = useCallback(async () => {
    if (isProcessingQueue.current || pendingSubmissions.current.length === 0) {
      return
    }

    isProcessingQueue.current = true

    while (pendingSubmissions.current.length > 0) {
      const submission = pendingSubmissions.current[0]

      // Safety check - should never be undefined given the while condition
      if (!submission) {
        pendingSubmissions.current.shift()
        continue
      }

      try {
        const response = await fetch('/api/reviews/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: submission.itemId,
            itemType: submission.itemType,
            userAnswer: submission.userAnswer,
            correctAnswer: submission.correctAnswer,
            grade: submission.grade,
            responseTimeMs: submission.responseTimeMs,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to submit review')
        }

        // Remove successfully processed submission
        pendingSubmissions.current.shift()
      } catch (error) {
        console.error('Error submitting review:', error)
        // Remove failed submission to prevent infinite loop
        pendingSubmissions.current.shift()
        // Show error but don't block - user already moved to next card
        toast.error('Failed to save review (will not affect progress)')
      }
    }

    isProcessingQueue.current = false
  }, [])

  /**
   * Submit review result - OPTIMISTIC UI
   * Advances to next card immediately, submits API in background
   */
  const handleSubmitReview = useCallback(
    (result: ReviewResult) => {
      // Prevent double-advance on rapid keypresses
      if (hasAdvancedRef.current) {
        return
      }

      const currentItem = queue[currentIndex]

      if (!currentItem) {
        return
      }

      // Mark as advanced to prevent double-processing
      hasAdvancedRef.current = true

      // OPTIMISTIC: Update stats immediately
      setTotalReviewed((prev) => prev + 1)
      if (result.isCorrect) {
        setCorrectCount((prev) => prev + 1)
      }

      // OPTIMISTIC: Move to next card immediately (before API call)
      const nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        setSessionComplete(true)
      } else {
        setCurrentIndex(nextIndex)
      }

      // Queue API submission for background processing
      pendingSubmissions.current.push({
        itemId: currentItem.itemId,
        itemType: currentItem.itemType,
        userAnswer: result.userAnswer,
        correctAnswer: currentItem.correctPinyin,
        grade: result.grade,
        responseTimeMs: result.responseTimeMs,
        isCorrect: result.isCorrect,
      })

      // Process queue in background (non-blocking)
      processSubmissionQueue()

      // Reset advance guard after a short delay (allows next card's grade)
      setTimeout(() => {
        hasAdvancedRef.current = false
      }, 50)
    },
    [currentIndex, queue, processSubmissionQueue]
  )

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
      <div className="mx-auto max-w-2xl space-y-6 p-4 text-center sm:p-8">
        <div className="mb-4 text-5xl sm:text-6xl">{hasCompletedReviews ? '🎉' : '📚'}</div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {hasCompletedReviews ? 'Session Complete!' : 'No Reviews Due'}
        </h1>

        {hasCompletedReviews ? (
          <>
            <div className="mx-auto grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="text-2xl font-bold text-primary sm:text-3xl">{totalReviewed}</div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-2xl font-bold text-green-600 sm:text-3xl">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
            <p className="px-2 text-sm text-muted-foreground sm:px-0 sm:text-base">
              Great work! Come back later for more reviews, or start a new lesson.
            </p>
          </>
        ) : (
          <p className="px-2 text-sm text-muted-foreground sm:px-0 sm:text-base">
            You&apos;re all caught up! Start a new lesson to learn more items.
          </p>
        )}

        <div className="flex flex-col justify-center gap-3 px-4 sm:flex-row sm:gap-4 sm:px-0">
          <Button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto">
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/lessons')}
            className="w-full sm:w-auto"
          >
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
    <div className="space-y-4 sm:space-y-6">
      {/* Progress bar */}
      <div className="mx-auto w-full max-w-2xl space-y-2 px-4 sm:px-0">
        <div className="flex justify-between text-xs text-muted-foreground sm:text-sm">
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
      <div className="px-4 sm:px-0">
        <ReviewCard
          key={currentItem.id} // Force remount on each item change
          character={currentItem.character}
          meaning={currentItem.meaning}
          correctPinyin={currentItem.correctPinyin}
          itemType={currentItem.itemType}
          onSubmit={handleSubmitReview}
          onSkip={handleSkip}
        />
      </div>

      {/* Session stats */}
      <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2 px-4 text-xs text-muted-foreground sm:gap-4 sm:px-0 sm:text-sm">
        <span>✓ {correctCount} correct</span>
        <span>• {totalReviewed} total</span>
        {totalReviewed > 0 && (
          <span>• {Math.round((correctCount / totalReviewed) * 100)}% accuracy</span>
        )}
      </div>
    </div>
  )
}
