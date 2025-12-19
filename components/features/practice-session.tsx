/**
 * Practice Session Component
 *
 * Practice mode for a specific lesson:
 * - Fetches ALL items from the lesson (not just due items)
 * - Does NOT update SRS state (no API submissions)
 * - Does NOT affect stats (accuracy, streak, etc.)
 * - Can be repeated unlimited times
 *
 * Key differences from ReviewSession:
 * - Fetches from /api/lessons/[id]/practice instead of /api/reviews/queue
 * - No API submissions on answer
 * - Different completion UI (Practice Again option)
 *
 * Dependencies: react, next/navigation, sonner, session-layout, review-card
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReviewCard } from './review-card'
import type { ReviewResult } from './review-card'
import {
  SessionLayout,
  SessionLoading,
  SessionError,
  SessionEmpty,
  SessionComplete,
  SessionProgressBar,
  SessionStatsDisplay,
} from './session-layout'
import { logger } from '@/lib/utils/logger'

/**
 * Practice item data structure
 */
interface PracticeItem {
  /** Unique item identifier */
  itemId: number
  /** Type of item being practiced */
  itemType: 'character' | 'vocabulary'
  /** Chinese character or word */
  character: string
  /** English meaning */
  meaning: string
  /** Correct pinyin with tone marks */
  correctPinyin: string
}

/**
 * Props for PracticeSession component
 */
interface PracticeSessionProps {
  /** Lesson ID to practice */
  lessonId: number
  /** Lesson title for display */
  lessonTitle: string
}

/**
 * Practice Session Manager
 *
 * Manages a practice session for a specific lesson.
 */
export function PracticeSession({ lessonId, lessonTitle }: PracticeSessionProps) {
  const router = useRouter()

  // State
  const [queue, setQueue] = useState<PracticeItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Stats (local only - not saved)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalReviewed, setTotalReviewed] = useState(0)

  // Refs
  const hasAdvancedRef = useRef(false)

  /**
   * Fetch practice items from API
   */
  const fetchPracticeItems = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetch(`/api/lessons/${lessonId}/practice`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch practice items')
      }

      // Transform API data to PracticeItem format
      const items: PracticeItem[] = data.data.items.map(
        (item: {
          item_id: number
          item_type: 'character' | 'vocabulary'
          character: string
          pinyin: string
          meaning: string
        }) => ({
          itemId: item.item_id,
          itemType: item.item_type,
          character: item.character,
          meaning: item.meaning,
          correctPinyin: item.pinyin,
        })
      )

      setQueue(items)

      if (items.length === 0) {
        setLoadError('This lesson has no items to practice.')
      }
    } catch (error) {
      logger.error('Error fetching practice items', {
        error: error instanceof Error ? error.message : String(error),
        lessonId,
      })
      const message = error instanceof Error ? error.message : 'Failed to load practice items'
      setLoadError(message)
      toast.error('Failed to load practice items')
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  // Fetch practice items on mount
  useEffect(() => {
    fetchPracticeItems()
  }, [fetchPracticeItems])

  /**
   * Handle answer submission - LOCAL ONLY (no API call)
   */
  const handleSubmitAnswer = useCallback(
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

      // Update local stats (not saved to server)
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

      // Reset advance guard after a short delay
      setTimeout(() => {
        hasAdvancedRef.current = false
      }, 50)
    },
    [currentIndex, queue]
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

  /**
   * Restart practice session
   */
  function handlePracticeAgain() {
    setCurrentIndex(0)
    setCorrectCount(0)
    setTotalReviewed(0)
    setSessionComplete(false)
    // Re-shuffle items for variety
    setQueue((prev) => [...prev].sort(() => Math.random() - 0.5))
  }

  // Navigation handlers
  const goToLesson = () => router.push(`/lessons/${lessonId}`)
  const goToLessons = () => router.push('/lessons')

  // Loading state
  if (isLoading) {
    return <SessionLoading message="Loading practice items..." />
  }

  // Error state
  if (loadError) {
    return (
      <SessionError
        message={loadError}
        onPrimaryAction={goToLesson}
        primaryActionText="Back to Lesson"
        onSecondaryAction={fetchPracticeItems}
        secondaryActionText="Try Again"
      />
    )
  }

  // Session complete
  if (sessionComplete) {
    const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0

    return (
      <SessionComplete
        emoji="🎉"
        title="Practice Complete!"
        description={`Great practice of "${lessonTitle}"! This doesn't affect your SRS schedule.`}
        stats={[
          { label: 'Items Practiced', value: totalReviewed, color: 'text-primary' },
          { label: 'Accuracy', value: accuracy, suffix: '%', color: 'text-green-600' },
        ]}
        actions={[
          { label: 'Practice Again', onClick: handlePracticeAgain },
          { label: 'Back to Lesson', onClick: goToLesson, variant: 'outline' },
          { label: 'All Lessons', onClick: goToLessons, variant: 'outline' },
        ]}
      />
    )
  }

  const currentItem = queue[currentIndex]

  if (!currentItem) {
    return (
      <SessionEmpty
        message="No items to practice"
        onAction={goToLesson}
        actionText="Back to Lesson"
      />
    )
  }

  return (
    <SessionLayout>
      <SessionProgressBar
        currentIndex={currentIndex}
        totalItems={queue.length}
        label="Practice Progress"
      />

      <div className="px-4 sm:px-0">
        <ReviewCard
          key={`${currentItem.itemId}-${currentItem.itemType}`}
          character={currentItem.character}
          meaning={currentItem.meaning}
          correctPinyin={currentItem.correctPinyin}
          itemType={currentItem.itemType}
          onSubmit={handleSubmitAnswer}
          onSkip={handleSkip}
        />
      </div>

      <SessionStatsDisplay
        correctCount={correctCount}
        totalReviewed={totalReviewed}
        additionalLabel="Practice mode"
      />
    </SessionLayout>
  )
}
