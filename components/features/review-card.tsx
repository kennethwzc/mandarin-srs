'use client'

import React, { useEffect, useCallback, memo, useRef, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { CharacterDisplay } from './character-display'
import { PinyinInput } from './pinyin-input'
import { ToneSelector } from './tone-selector'
import { PinyinFeedback } from './pinyin-feedback'
import {
  comparePinyinExact,
  addToneMark,
  removeToneMarks,
  convertToneNumbers,
  normalizeSpaces,
} from '@/lib/utils/pinyin-utils'
import { calculateGradeFromTime } from '@/lib/utils/srs-algorithm'
import { cn } from '@/lib/utils/cn'

// Re-export types for external use
export type { ReviewCardProps, ReviewResult } from './review-card.types'

// Import ReviewCardProps for internal use in the component
type ReviewCardPropsInternal = import('./review-card.types').ReviewCardProps

/**
 * Apply tone to the last syllable in the input
 * Simple, predictable, no cursor tracking needed
 */
function applyToneToLastSyllable(input: string, tone: number): string {
  if (!input.trim()) {
    return input
  }

  // Split by spaces
  const parts = input.trim().split(/\s+/)

  if (parts.length === 0) {
    return input
  }

  // Get last part
  const lastPart = parts[parts.length - 1]
  if (!lastPart) {
    return input
  }

  // Remove any existing tone number (e.g., "zai4" → "zai")
  const baseSyllable = lastPart.replace(/[1-5]$/, '')

  // Remove any existing tone marks
  const cleanSyllable = removeToneMarks(baseSyllable)

  // Apply tone mark
  let withTone: string
  try {
    withTone = addToneMark(cleanSyllable, tone)
  } catch {
    // Invalid syllable, return original
    return input
  }

  // Replace last part
  parts[parts.length - 1] = withTone

  // Preserve trailing space if original had it
  const hadTrailingSpace = input.endsWith(' ')
  return parts.join(' ') + (hadTrailingSpace ? ' ' : '')
}

/**
 * Normalize input for submission
 * Converts all tone numbers to tone marks
 */
function normalizeForSubmit(input: string): string {
  // 1. Trim and normalize spaces
  let normalized = normalizeSpaces(input)

  // 2. Convert all tone numbers to tone marks
  normalized = convertToneNumbers(normalized)

  return normalized
}

/**
 * Review Card Component (KISS - Keep It Simple, Stupid)
 *
 * Main component for reviewing items. Shows character and collects pinyin answer.
 * Uses simple state management - no complex hooks or cursor tracking.
 *
 * Flow:
 * 1. Show character
 * 2. User types pinyin (numbers or marks)
 * 3. User optionally clicks tone buttons
 * 4. User submits answer
 * 5. Show feedback (correct/incorrect)
 * 6. User clicks "Next" to continue
 */

export const ReviewCard = memo(function ReviewCard({
  character,
  meaning,
  correctPinyin,
  itemType,
  onSubmit,
  onSkip,
}: ReviewCardPropsInternal) {
  // Simple state - just the input value
  const [userInput, setUserInput] = useState('')
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [startTime, setStartTime] = useState(Date.now())

  // Refs to prevent double-submission
  const isSubmittingRef = useRef(false)

  // Reset state when character changes
  useEffect(() => {
    setUserInput('')
    setIsAnswerSubmitted(false)
    setIsCorrect(null)
    setStartTime(Date.now())
    isSubmittingRef.current = false
  }, [character])

  /**
   * Handle tone selection from ToneSelector
   * Applies to last syllable - simple and predictable
   */
  const handleToneSelect = useCallback((tone: number) => {
    setUserInput((prev) => applyToneToLastSyllable(prev, tone))
  }, [])

  /**
   * Get final normalized value for comparison
   */
  const getFinalValue = useCallback(() => {
    return normalizeForSubmit(userInput)
  }, [userInput])

  /**
   * Handle answer submission
   */
  const handleSubmitAnswer = useCallback(() => {
    if (isSubmittingRef.current || isAnswerSubmitted) {
      return
    }

    const finalInput = normalizeForSubmit(userInput)
    if (!finalInput.trim()) {
      return
    }

    isSubmittingRef.current = true

    const answeredCorrectly = comparePinyinExact(finalInput, correctPinyin)

    setIsCorrect(answeredCorrectly)
    setIsAnswerSubmitted(true)

    // Remove focus from input to allow Enter key to continue
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    setTimeout(() => {
      isSubmittingRef.current = false
    }, 100)
  }, [userInput, correctPinyin, isAnswerSubmitted])

  /**
   * Handle continue/next - auto-calculates grade based on response time
   */
  const handleContinue = useCallback(() => {
    if (!isAnswerSubmitted || isCorrect === null) {
      return
    }

    const responseTime = Date.now() - startTime
    const correct = isCorrect ?? false
    const autoGrade = calculateGradeFromTime(responseTime, character.length, correct)
    const finalInput = normalizeForSubmit(userInput)

    onSubmit({
      userAnswer: finalInput,
      isCorrect: correct,
      grade: autoGrade,
      responseTimeMs: responseTime,
    })
  }, [userInput, isCorrect, startTime, onSubmit, character.length, isAnswerSubmitted])

  /**
   * Keyboard shortcuts (window-level when input not focused)
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if (e.key === 'Enter') {
        if (!isAnswerSubmitted) {
          handleSubmitAnswer()
        } else {
          handleContinue()
        }
      }

      if (e.key === 'Escape' && onSkip && !isAnswerSubmitted) {
        onSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isAnswerSubmitted, handleSubmitAnswer, handleContinue, onSkip])

  return (
    <div className="w-full">
      <Card
        className={cn(
          'mx-auto w-full max-w-2xl',
          'rounded-2xl border-2 shadow-soft-lg',
          'transition-all duration-300',

          // Clean feedback states - subtle backgrounds only
          isAnswerSubmitted &&
            isCorrect &&
            'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
          isAnswerSubmitted &&
            isCorrect === false &&
            'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
        )}
      >
        <CardContent className="space-y-6 p-6 sm:space-y-8 sm:p-8 md:p-12">
          {/* Character Display */}
          <CharacterDisplay
            character={character}
            meaning={meaning}
            itemType={itemType}
            showMeaning={!isAnswerSubmitted}
            feedbackState={!isAnswerSubmitted ? null : isCorrect ? 'correct' : 'incorrect'}
          />

          {/* Input Section */}
          {!isAnswerSubmitted ? (
            <div className="space-y-6">
              <PinyinInput
                value={userInput}
                onChange={setUserInput}
                disabled={isAnswerSubmitted}
                onSubmit={handleSubmitAnswer}
                autoFocus
              />

              <ToneSelector
                selectedTone={null}
                onToneSelect={handleToneSelect}
                disabled={isAnswerSubmitted}
              />

              {/* Check Answer Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userInput.trim()}
                  className={cn(
                    'rounded-xl px-8 py-3 font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 hover:shadow-soft-md',
                    'transition-all duration-200 active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'min-h-[48px] min-w-[200px]'
                  )}
                >
                  Check Answer
                  <span className="ml-2 hidden text-sm opacity-70 sm:inline">(Enter)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Feedback Section */
            <div className="space-y-6">
              <PinyinFeedback
                isCorrect={isCorrect}
                userAnswer={getFinalValue()}
                correctAnswer={correctPinyin}
                show={isAnswerSubmitted}
              />

              {/* Next Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleContinue}
                  className={cn(
                    'rounded-xl px-12 py-3 font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 hover:shadow-soft-md',
                    'transition-all duration-200 active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'min-h-[48px] min-w-[200px]'
                  )}
                >
                  Next
                  <span className="ml-2 hidden text-sm opacity-70 sm:inline">(Enter)</span>
                </button>
              </div>
            </div>
          )}

          {/* Skip button (optional) */}
          {onSkip && !isAnswerSubmitted && (
            <div className="pt-2 text-center">
              <button
                onClick={onSkip}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
