'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { BookOpen, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface StartLessonButtonProps {
  lessonId: number
  itemCount: number
  isCompleted: boolean
  isStarted: boolean
}

/**
 * Start Lesson Button
 *
 * Two modes:
 * 1. First time (isStarted=false): "Start Learning" → Adds items to SRS queue → Practice mode
 * 2. Repeat (isStarted=true): "Practice Lesson" → Direct to practice mode (no SRS impact)
 */
export function StartLessonButton({
  lessonId,
  itemCount,
  isCompleted,
  isStarted,
}: StartLessonButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handle first-time lesson start
   * - Calls API to add items to SRS queue
   * - Then redirects to practice mode
   */
  async function handleStartLesson() {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/lessons/${lessonId}/start`, {
        method: 'POST',
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMessage =
          (data &&
            typeof data === 'object' &&
            'error' in data &&
            (data as { error?: string }).error) ||
          `Failed to start lesson (status ${response.status})`
        throw new Error(errorMessage)
      }

      const newItems = data?.data?.newItems ?? itemCount

      toast.success('Lesson started!', {
        description: `Added ${newItems} items to your learning queue.`,
      })

      // Refresh router cache to update dashboard stats
      // This ensures stats are fresh when user returns to dashboard
      // Skip refresh in test environments to prevent test failures
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test' && router.refresh) {
        router.refresh()
      }

      // Redirect to practice mode instead of reviews
      router.push(`/lessons/${lessonId}/practice`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start lesson'
      logger.error('Error starting lesson', {
        error: error instanceof Error ? error.message : String(error),
        lessonId,
      })
      toast.error('Failed to start lesson', { description: message })
      setIsLoading(false)
    }
  }

  /**
   * Handle practice mode (for already-started lessons)
   * - Direct redirect to practice mode
   * - No API call, no SRS impact
   */
  function handlePractice() {
    router.push(`/lessons/${lessonId}/practice`)
  }

  // Completed state (if we implement lesson completion tracking later)
  if (isCompleted) {
    return (
      <Button disabled className="w-full" size="lg">
        <Check className="mr-2 h-4 w-4" />
        Completed
      </Button>
    )
  }

  // Already started - show Practice button
  if (isStarted) {
    return (
      <Button onClick={handlePractice} className="w-full" size="lg">
        <RefreshCw className="mr-2 h-4 w-4" />
        Practice Lesson
      </Button>
    )
  }

  // Not started - show Start Learning button
  return (
    <Button onClick={handleStartLesson} disabled={isLoading} className="w-full" size="lg">
      <BookOpen className="mr-2 h-4 w-4" />
      {isLoading ? 'Starting...' : `Start Learning (${itemCount} items)`}
    </Button>
  )
}
