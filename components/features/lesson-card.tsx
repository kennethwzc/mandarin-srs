'use client'

import { memo } from 'react'
import Link from 'next/link'
import { cva } from 'class-variance-authority'
import { Check, Lock } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

/**
 * Lesson Card Component
 *
 * Displays a lesson in the lesson list with clean, Apple-inspired minimalist design.
 * Shows locked/unlocked state, completion status, and content preview.
 *
 * Design principles:
 * - Minimal, purposeful styling
 * - Subtle shadows and hover states
 * - Clean typography hierarchy
 * - Accessible by default
 */

const cardVariants = cva(
  'block rounded-xl bg-card border p-6 md:p-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      status: {
        locked: 'opacity-50 cursor-not-allowed border-border',
        unlocked: 'hover:shadow-soft-lg hover:-translate-y-0.5 border-border cursor-pointer',
        completed: 'border-l-2 border-l-green-500 dark:border-l-green-400 border-border',
      },
    },
    defaultVariants: {
      status: 'unlocked',
    },
  }
)

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

export const LessonCard = memo(function LessonCard({ lesson }: LessonCardProps) {
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

  const status = !isUnlocked ? 'locked' : isCompleted ? 'completed' : 'unlocked'
  const cardClassName = cn(cardVariants({ status }))
  const ariaLabel = `${title}. Level ${level}. ${
    isCompleted ? 'Completed' : !isUnlocked ? 'Locked' : 'Available'
  }. ${characterCount} characters, ${vocabularyCount} vocabulary.`

  const cardContent = (
    <>
      {/* Header with level and status icon */}
      <div className="mb-3 flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">Level {level}</span>
        {isCompleted && (
          <Check className="h-4 w-4 text-green-500 dark:text-green-400" aria-label="Completed" />
        )}
        {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />}
      </div>

      {/* Title */}
      <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {/* Stats with bullet separator */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">{characterCount}</span> characters
        <span className="mx-2">·</span>
        <span className="font-medium">{vocabularyCount}</span> vocabulary
      </div>

      {/* Locked message */}
      {!isUnlocked && (
        <p className="mt-4 text-xs text-muted-foreground">Complete previous lesson to unlock</p>
      )}
    </>
  )

  if (isUnlocked) {
    return (
      <Link
        href={`/lessons/${id}`}
        className={cardClassName}
        data-testid="lesson-card"
        aria-label={ariaLabel}
        style={{ contentVisibility: 'auto' }}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div
      className={cardClassName}
      data-testid="lesson-card"
      aria-label={ariaLabel}
      style={{ contentVisibility: 'auto' }}
    >
      {cardContent}
    </div>
  )
})
