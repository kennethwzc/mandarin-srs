'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { ReviewCard } from './review-card'
import type { ReviewResult } from './review-card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * Practice Session Manager
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
 */

interface PracticeItem {
  itemId: number
  itemType: 'character' | 'vocabulary'
  character: string
  meaning: string
  correctPinyin: string
}

interface PracticeSessionProps {
  lessonId: number
  lessonTitle: string
}

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

  // Fetch practice items on mount
  useEffect(() => {
    fetchPracticeItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  /**
   * Fetch practice items from API
   */
  async function fetchPracticeItems() {
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
      console.error('Error fetching practice items:', error)
      const message = error instanceof Error ? error.message : 'Failed to load practice items'
      setLoadError(message)
      toast.error('Failed to load practice items')
    } finally {
      setIsLoading(false)
    }
  }

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading practice items...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 text-center sm:p-8">
        <div className="mb-4 text-5xl">😕</div>
        <h1 className="text-2xl font-bold sm:text-3xl">Unable to Load Practice</h1>
        <p className="text-muted-foreground">{loadError}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Button onClick={() => router.push(`/lessons/${lessonId}`)}>Back to Lesson</Button>
          <Button variant="outline" onClick={() => fetchPracticeItems()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Session complete
  if (sessionComplete) {
    const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0

    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 text-center sm:p-8">
        <div className="mb-4 text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-2xl font-bold sm:text-3xl">Practice Complete!</h1>

        <div className="mx-auto grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="text-2xl font-bold text-primary sm:text-3xl">{totalReviewed}</div>
            <div className="text-sm text-muted-foreground">Items Practiced</div>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <div className="text-2xl font-bold text-green-600 sm:text-3xl">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        <p className="px-2 text-sm text-muted-foreground sm:px-0 sm:text-base">
          Great practice of &quot;{lessonTitle}&quot;! This doesn&apos;t affect your SRS schedule.
        </p>

        <div className="flex flex-col justify-center gap-3 px-4 sm:flex-row sm:gap-4 sm:px-0">
          <Button onClick={handlePracticeAgain} className="w-full sm:w-auto">
            Practice Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/lessons/${lessonId}`)}
            className="w-full sm:w-auto"
          >
            Back to Lesson
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/lessons')}
            className="w-full sm:w-auto"
          >
            All Lessons
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
        <p className="text-muted-foreground">No items to practice</p>
        <Button onClick={() => router.push(`/lessons/${lessonId}`)} className="mt-4">
          Back to Lesson
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress bar */}
      <div className="mx-auto w-full max-w-2xl space-y-2 px-4 sm:px-0">
        <div className="flex justify-between text-xs text-muted-foreground sm:text-sm">
          <span>Practice Progress</span>
          <span>
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          aria-label={`Practice progress: ${currentIndex + 1} of ${queue.length} items`}
        />
      </div>

      {/* Practice card (uses same ReviewCard component) */}
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

      {/* Session stats (local only) */}
      <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2 px-4 text-xs text-muted-foreground sm:gap-4 sm:px-0 sm:text-sm">
        <span>✓ {correctCount} correct</span>
        <span>• {totalReviewed} total</span>
        {totalReviewed > 0 && (
          <span>• {Math.round((correctCount / totalReviewed) * 100)}% accuracy</span>
        )}
        <span className="text-blue-500">• Practice mode</span>
      </div>
    </div>
  )
}
