'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { BookOpen, Check } from 'lucide-react'
import { toast } from 'sonner'

interface StartLessonButtonProps {
  lessonId: number
  itemCount: number
  isCompleted: boolean
  isStarted: boolean
}

/**
 * Start Lesson Button
 *
 * Adds all lesson items to user's review queue and marks lesson as started.
 */
export function StartLessonButton({
  lessonId,
  itemCount,
  isCompleted,
  isStarted,
}: StartLessonButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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

      toast.success('Lesson started!', {
        description: `Added ${itemCount} items to your review queue.`,
      })

      router.push('/reviews')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start lesson'
      console.error('Error starting lesson:', error)
      toast.error('Failed to start lesson', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCompleted) {
    return (
      <Button disabled className="w-full" size="lg">
        <Check className="mr-2 h-4 w-4" />
        Completed
      </Button>
    )
  }

  return (
    <Button onClick={handleStartLesson} disabled={isLoading} className="w-full" size="lg">
      <BookOpen className="mr-2 h-4 w-4" />
      {isLoading
        ? 'Starting...'
        : isStarted
          ? 'Continue Learning'
          : `Start Learning (${itemCount} items)`}
    </Button>
  )
}
