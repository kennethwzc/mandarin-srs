'use client'

import React, { useEffect, useRef, useCallback } from 'react'

import { cn } from '@/lib/utils/cn'
import { GRADES } from '@/lib/utils/srs-constants'

/**
 * Grade Buttons Component
 *
 * Self-assessment buttons for rating how well you knew the answer.
 * This determines the next review interval.
 *
 * Performance optimizations:
 * - Debounced keyboard handler to prevent double-presses
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Leading-edge debounce for instant response
 *
 * Grades:
 * - Again (0): Complete failure - didn't know at all
 * - Hard (1): Difficult - barely remembered
 * - Good (2): Correct with reasonable effort
 * - Easy (3): Instant recall, very easy
 */

interface GradeButtonsProps {
  onGrade: (grade: number) => void
  isCorrect: boolean
  disabled?: boolean
}

const GRADE_INFO = [
  {
    grade: GRADES.AGAIN,
    label: 'Again',
    shortcut: '1',
    color: 'bg-red-500 hover:bg-red-600',
    description: "Didn't know it",
  },
  {
    grade: GRADES.HARD,
    label: 'Hard',
    shortcut: '2',
    color: 'bg-orange-500 hover:bg-orange-600',
    description: 'Difficult to recall',
  },
  {
    grade: GRADES.GOOD,
    label: 'Good',
    shortcut: '3',
    color: 'bg-green-500 hover:bg-green-600',
    description: 'Correct with effort',
  },
  {
    grade: GRADES.EASY,
    label: 'Easy',
    shortcut: '4',
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Instant recall',
  },
]

// Debounce delay to prevent double-presses (ms)
const DEBOUNCE_DELAY = 150

export function GradeButtons({ onGrade, disabled = false }: GradeButtonsProps) {
  // Ref to track if a grade has been processed (prevents double-press)
  const hasGradedRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Memoized grade handler with leading-edge debounce
  const handleGrade = useCallback(
    (grade: number) => {
      // Prevent double-grading
      if (hasGradedRef.current || disabled) {
        return
      }

      // Mark as graded immediately (leading edge)
      hasGradedRef.current = true

      // Call the callback immediately for instant response
      onGrade(grade)

      // Reset after debounce delay
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        hasGradedRef.current = false
      }, DEBOUNCE_DELAY)
    },
    [onGrade, disabled]
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Reset hasGraded when component mounts (new card)
  useEffect(() => {
    hasGradedRef.current = false
  }, [])

  // Keyboard shortcuts with debounce
  useEffect(() => {
    if (disabled) {
      return
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key
      if (key >= '1' && key <= '4') {
        e.preventDefault() // Prevent any default behavior
        const grade = parseInt(key, 10) - 1 // Convert to 0-3
        handleGrade(grade)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [disabled, handleGrade])

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-muted-foreground">How well did you know this?</p>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {GRADE_INFO.map(({ grade, label, shortcut, color, description }) => (
          <button
            key={grade}
            onClick={() => handleGrade(grade)}
            disabled={disabled}
            className={cn(
              'relative rounded-lg p-4',
              'font-medium text-white',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              color
            )}
            aria-label={`Grade as ${label}: ${description}`}
          >
            <div className="text-lg">{label}</div>
            <div className="mt-1 text-xs opacity-80">{description}</div>

            {/* Keyboard shortcut hint */}
            <span
              className={cn(
                'keyboard-hint absolute -right-2 -top-2',
                'h-5 w-5 rounded-full',
                'border border-white/30 bg-white/20',
                'flex items-center justify-center text-xs',
                'font-mono'
              )}
            >
              {shortcut}
            </span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">Press 1-4 to grade quickly</p>
    </div>
  )
}
