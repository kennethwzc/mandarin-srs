'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Check, Lock } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

/**
 * Lesson Card Component
 *
 * Displays a lesson in the lesson list.
 * Shows locked/unlocked state, completion status, and content preview.
 */

interface LessonCardProps {
  lesson: {
    id: number
    level: number
    title: string
    description: string | null
    characterCount: number
    vocabularyCount: number
    isUnlocked: boolean
    isCompleted: boolean
    completionDate?: Date | null
  }
}

export function LessonCard({ lesson }: LessonCardProps) {
  const {
    id,
    level,
    title,
    description,
    characterCount,
    vocabularyCount,
    isUnlocked,
    isCompleted,
  } = lesson

  const totalItems = characterCount + vocabularyCount

  return (
    <Link
      href={isUnlocked ? `/lessons/${id}` : '#'}
      className={cn(
        'block transition-all duration-200',
        isUnlocked ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'
      )}
    >
      <Card
        className={cn(
          'relative overflow-hidden',
          !isUnlocked && 'bg-muted opacity-60',
          isCompleted && 'border-green-500 dark:border-green-700'
        )}
      >
        {isCompleted && (
          <div className="absolute right-0 top-0 h-0 w-0 border-r-[60px] border-t-[60px] border-r-transparent border-t-green-500">
            <Check className="absolute -right-[50px] -top-[50px] h-6 w-6 rotate-45 text-white" />
          </div>
        )}

        {!isUnlocked && (
          <div className="absolute right-4 top-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Level {level}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                )}
              </div>
              <CardTitle className="mb-1 text-xl">{title}</CardTitle>
              {description && (
                <CardDescription className="line-clamp-2">{description}</CardDescription>
              )}
            </div>
            <BookOpen
              className={cn(
                'h-8 w-8 flex-shrink-0',
                isCompleted ? 'text-green-500' : 'text-muted-foreground'
              )}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{characterCount}</span>
              <span>characters</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{vocabularyCount}</span>
              <span>vocabulary</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{totalItems}</span>
              <span>total items</span>
            </div>
          </div>

          {!isUnlocked && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Complete previous lesson to unlock</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
