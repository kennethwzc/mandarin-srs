'use client'

import { memo } from 'react'
import { BookOpen, Check, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PrefetchLink } from '@/components/ui/prefetch-link'
import { cn } from '@/lib/utils/cn'

interface LessonProgressProps {
  lessons: Array<{
    id: number
    title: string
    isCompleted: boolean
    isUnlocked: boolean
  }>
}

/**
 * Lesson item content - shared between link and div versions
 */
interface LessonItemContentProps {
  lesson: {
    id: number
    title: string
    isCompleted: boolean
    isUnlocked: boolean
  }
}

function LessonItemContent({ lesson }: LessonItemContentProps) {
  return (
    <>
      {/* Status icon */}
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          lesson.isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'
        )}
      >
        {lesson.isCompleted ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" aria-label="Completed" />
        ) : lesson.isUnlocked ? (
          <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />
        )}
      </div>

      {/* Lesson title */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            lesson.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {lesson.title}
        </p>
      </div>

      {/* Completed badge */}
      {lesson.isCompleted && (
        <span className="text-xs font-medium text-green-600 dark:text-green-400">Done</span>
      )}
    </>
  )
}

/**
 * Lesson Progress Component (Apple-inspired minimalist design)
 *
 * Shows user's progress through lessons with clean, minimal styling.
 * Uses subtle visual hierarchy instead of colored badges.
 */
export const LessonProgress = memo(function LessonProgress({ lessons }: LessonProgressProps) {
  const totalLessons = lessons.length
  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const baseItemClasses =
    'flex items-center gap-3 rounded-lg border border-border p-3 transition-all duration-base'
  const interactiveClasses =
    'cursor-pointer hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  const lockedClasses = 'cursor-not-allowed opacity-50'

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lesson Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>
        <Button asChild size="sm" variant="ghost" className="text-muted-foreground">
          <PrefetchLink
            href="/lessons"
            prefetchDataKey="lessons:prefetch"
            prefetchDataFetcher={async () => {
              const response = await fetch('/api/lessons', { credentials: 'include' })
              if (!response.ok) {
                throw new Error('Failed to prefetch lessons')
              }
              return response.json()
            }}
          >
            View All
          </PrefetchLink>
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-4 p-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium text-foreground">{progressPercentage}%</span>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Lesson progress: ${progressPercentage}% complete`}
          >
            <div
              className="h-full bg-primary transition-all duration-slow"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Lesson list */}
        <div className="space-y-2">
          {lessons.slice(0, 5).map((lesson) => {
            const ariaLabel = `${lesson.title}. ${
              lesson.isCompleted ? 'Completed' : lesson.isUnlocked ? 'Available' : 'Locked'
            }`

            if (lesson.isUnlocked) {
              return (
                <PrefetchLink
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  prefetchDataKey={`lesson:${lesson.id}:prefetch`}
                  prefetchDataFetcher={async () => {
                    const response = await fetch(`/api/lessons/${lesson.id}`, {
                      credentials: 'include',
                    })
                    if (!response.ok) {
                      throw new Error('Failed to prefetch lesson')
                    }
                    return response.json()
                  }}
                  className={cn(baseItemClasses, interactiveClasses)}
                  aria-label={ariaLabel}
                >
                  <LessonItemContent lesson={lesson} />
                </PrefetchLink>
              )
            }

            return (
              <div
                key={lesson.id}
                className={cn(baseItemClasses, lockedClasses)}
                aria-label={ariaLabel}
              >
                <LessonItemContent lesson={lesson} />
              </div>
            )
          })}
        </div>

        {/* View more button */}
        {lessons.length > 5 && (
          <Button asChild className="w-full" variant="ghost">
            <PrefetchLink
              href="/lessons"
              prefetchDataKey="lessons:prefetch"
              prefetchDataFetcher={async () => {
                const response = await fetch('/api/lessons', { credentials: 'include' })
                if (!response.ok) {
                  throw new Error('Failed to prefetch lessons')
                }
                return response.json()
              }}
            >
              View all {lessons.length} lessons
            </PrefetchLink>
          </Button>
        )}
      </div>
    </div>
  )
})
