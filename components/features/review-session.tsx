/**
 * Review Session Component
 *
 * Manages a review session:
 * - Receives pre-fetched review queue from server (SSR)
 * - Shows cards one by one
 * - Submits answers to API (optimistically - non-blocking)
 * - Tracks progress
 * - Shows completion screen
 *
 * Performance optimizations:
 * - Server-side data fetching: Queue is pre-loaded during SSR
 * - Optimistic UI: Card advances immediately, API submits in background
 * - Memoized callbacks: Prevents unnecessary re-renders
 * - Submission queue: Handles rapid keypresses without blocking
 *
 * Dependencies: react, next/navigation, sonner, session-layout, review-card
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReviewCard } from './review-card'
import type { ReviewResult } from './review-card'
import {
  SessionLayout,
  SessionEmpty,
  SessionComplete,
  SessionProgressBar,
  SessionStatsDisplay,
} from './session-layout'
import { logger } from '@/lib/utils/logger'

/**
 * Review item data structure
 */
export interface ReviewItem {
  /** Unique review ID */
  id: string
  /** Item ID in database */
  itemId: number
  /** Type of item being reviewed */
  itemType: 'radical' | 'character' | 'vocabulary'
  /** Chinese character or word */
  character: string
  /** English meaning */
  meaning: string
  /** Correct pinyin with tone marks */
  correctPinyin: string
}

/**
 * Props for ReviewSession component
 */
export interface ReviewSessionProps {
  /** Pre-fetched review queue from server (SSR) */
  initialQueue: ReviewItem[]
}

/**
 * Pending API submission data
 */
interface PendingSubmission {
  itemId: number
  itemType: 'radical' | 'character' | 'vocabulary'
  userAnswer: string
  correctAnswer: string
  grade: number
  responseTimeMs: number
  isCorrect: boolean
}

/**
 * Review Session Manager
 *
 * Manages the full review session lifecycle with optimistic UI updates.
 * Receives pre-fetched queue from server for faster initial render.
 */
export function ReviewSession({ initialQueue }: ReviewSessionProps) {
  const router = useRouter()

  // State - initialize with server-provided data
  const [queue] = useState<ReviewItem[]>(initialQueue)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(initialQueue.length === 0)

  // Stats
  const [correctCount, setCorrectCount] = useState(0)
  const [totalReviewed, setTotalReviewed] = useState(0)

  // Refs for optimistic UI
  const pendingSubmissions = useRef<PendingSubmission[]>([])
  const isProcessingQueue = useRef(false)
  const hasAdvancedRef = useRef(false)

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

        pendingSubmissions.current.shift()
      } catch (error) {
        logger.error('Error submitting review', {
          error: error instanceof Error ? error.message : String(error),
        })
        pendingSubmissions.current.shift()
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
      if (hasAdvancedRef.current) {
        return
      }

      const currentItem = queue[currentIndex]

      if (!currentItem) {
        return
      }

      hasAdvancedRef.current = true

      // OPTIMISTIC: Update stats immediately
      setTotalReviewed((prev) => prev + 1)
      if (result.isCorrect) {
        setCorrectCount((prev) => prev + 1)
      }

      // OPTIMISTIC: Move to next card immediately
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

      // Process queue in background
      processSubmissionQueue()

      // Reset advance guard after short delay
      setTimeout(() => {
        hasAdvancedRef.current = false
      }, 50)
    },
    [currentIndex, queue, processSubmissionQueue]
  )

  /**
   * Handle skip
   */
  function handleSkip() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) {
      setSessionComplete(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }

  // Navigation handlers
  const goToDashboard = () => {
    // Refresh router cache before navigation to ensure fresh dashboard data
    router.refresh()
    router.push('/dashboard')
  }
  const goToLessons = () => router.push('/lessons')

  // Session complete or no reviews
  if (sessionComplete) {
    const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0
    const hasCompletedReviews = totalReviewed > 0

    return (
      <SessionComplete
        emoji={hasCompletedReviews ? '🎉' : '📚'}
        title={hasCompletedReviews ? 'Session Complete!' : 'No Reviews Due'}
        description={
          hasCompletedReviews
            ? 'Great work! Come back later for more reviews, or start a new lesson.'
            : "You're all caught up! Start a new lesson to learn more items."
        }
        stats={
          hasCompletedReviews
            ? [
                { label: 'Reviews', value: totalReviewed, color: 'text-primary' },
                { label: 'Accuracy', value: accuracy, suffix: '%', color: 'text-green-600' },
              ]
            : undefined
        }
        actions={[
          { label: 'Back to Dashboard', onClick: goToDashboard },
          { label: 'Browse Lessons', onClick: goToLessons, variant: 'outline' },
        ]}
      />
    )
  }

  const currentItem = queue[currentIndex]

  if (!currentItem) {
    return (
      <SessionEmpty
        message="No reviews available"
        onAction={goToDashboard}
        actionText="Back to Dashboard"
      />
    )
  }

  return (
    <SessionLayout>
      <SessionProgressBar currentIndex={currentIndex} totalItems={queue.length} />

      <div className="px-4 sm:px-0">
        <ReviewCard
          key={currentItem.id}
          character={currentItem.character}
          meaning={currentItem.meaning}
          correctPinyin={currentItem.correctPinyin}
          itemType={currentItem.itemType}
          onSubmit={handleSubmitReview}
          onSkip={handleSkip}
        />
      </div>

      <SessionStatsDisplay correctCount={correctCount} totalReviewed={totalReviewed} />
    </SessionLayout>
  )
}
