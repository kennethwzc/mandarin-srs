'use client'

import Link from 'next/link'

import { BookOpen, Check, Lock } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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
 * Lesson Progress Component
 *
 * Shows user's progress through lessons with completion status.
 */
export function LessonProgress({ lessons }: LessonProgressProps) {
  const totalLessons = lessons.length
  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lesson Progress</CardTitle>
            <CardDescription>
              {completedLessons} of {totalLessons} lessons completed
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/lessons">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {lessons.slice(0, 5).map((lesson) => (
            <Link
              key={lesson.id}
              href={lesson.isUnlocked ? `/lessons/${lesson.id}` : '#'}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                lesson.isUnlocked
                  ? 'cursor-pointer hover:bg-muted'
                  : 'cursor-not-allowed opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  lesson.isCompleted
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : lesson.isUnlocked
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : 'bg-muted'
                )}
              >
                {lesson.isCompleted ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : lesson.isUnlocked ? (
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm font-medium',
                    !lesson.isUnlocked && 'text-muted-foreground'
                  )}
                >
                  {lesson.title}
                </p>
              </div>

              {lesson.isCompleted && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Completed
                </span>
              )}
            </Link>
          ))}
        </div>

        {lessons.length > 5 && (
          <Button asChild className="w-full" variant="ghost">
            <Link href="/lessons">View all {lessons.length} lessons</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
