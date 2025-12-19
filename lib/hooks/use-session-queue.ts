/**
 * Session Queue Hook
 *
 * Shared state management for practice and review sessions.
 * Handles queue navigation, statistics tracking, and session completion.
 *
 * Dependencies: react
 *
 * @example
 * ```tsx
 * const { currentIndex, moveToNext, isComplete, stats } = useSessionQueue(items);
 * ```
 */

'use client'

import { useState, useCallback, useRef } from 'react'

/**
 * Statistics tracked during a session
 */
export interface SessionStats {
  /** Number of correct answers */
  correctCount: number
  /** Total items reviewed */
  totalReviewed: number
  /** Calculated accuracy percentage (0-100) */
  accuracy: number
}

/**
 * Return type for useSessionQueue hook
 */
export interface UseSessionQueueReturn<T> {
  /** Current item index in the queue */
  currentIndex: number
  /** Current item being reviewed */
  currentItem: T | undefined
  /** Whether the session is complete */
  isComplete: boolean
  /** Session statistics */
  stats: SessionStats
  /** Move to the next item, optionally recording if answer was correct */
  moveToNext: (wasCorrect?: boolean) => void
  /** Skip current item without recording result */
  skip: () => void
  /** Reset session to beginning */
  reset: (shuffleItems?: boolean) => void
  /** Total items in queue */
  totalItems: number
  /** Progress percentage (0-100) */
  progress: number
}

/**
 * Hook for managing session queue state
 *
 * Provides shared logic for both practice and review sessions including:
 * - Current index tracking
 * - Statistics (correct count, total reviewed, accuracy)
 * - Navigation (next, skip, reset)
 * - Session completion detection
 *
 * @param initialQueue - Array of items to review
 * @returns Session queue state and handlers
 */
export function useSessionQueue<T>(initialQueue: T[]): UseSessionQueueReturn<T> {
  const [queue, setQueue] = useState<T[]>(initialQueue)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalReviewed, setTotalReviewed] = useState(0)

  // Prevent double-advance on rapid keypresses
  const hasAdvancedRef = useRef(false)

  /**
   * Move to next item in queue
   * @param wasCorrect - Whether the answer was correct (for stats tracking)
   */
  const moveToNext = useCallback(
    (wasCorrect?: boolean) => {
      if (hasAdvancedRef.current) {
        return
      }

      hasAdvancedRef.current = true

      // Update stats if result provided
      if (wasCorrect !== undefined) {
        setTotalReviewed((prev) => prev + 1)
        if (wasCorrect) {
          setCorrectCount((prev) => prev + 1)
        }
      }

      // Check if session is complete
      const nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        setIsComplete(true)
      } else {
        setCurrentIndex(nextIndex)
      }

      // Reset advance guard after short delay
      setTimeout(() => {
        hasAdvancedRef.current = false
      }, 50)
    },
    [currentIndex, queue.length]
  )

  /**
   * Skip current item without recording result
   */
  const skip = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentIndex, queue.length])

  /**
   * Reset session to beginning
   * @param shuffleItems - Whether to shuffle the queue
   */
  const reset = useCallback(
    (shuffleItems = false) => {
      setCurrentIndex(0)
      setCorrectCount(0)
      setTotalReviewed(0)
      setIsComplete(false)
      hasAdvancedRef.current = false

      if (shuffleItems) {
        setQueue((prev) => [...prev].sort(() => Math.random() - 0.5))
      }
    },
    []
  )

  // Calculate derived values
  const currentItem = queue[currentIndex]
  const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0
  const progress = queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0

  return {
    currentIndex,
    currentItem,
    isComplete,
    stats: {
      correctCount,
      totalReviewed,
      accuracy,
    },
    moveToNext,
    skip,
    reset,
    totalItems: queue.length,
    progress,
  }
}

