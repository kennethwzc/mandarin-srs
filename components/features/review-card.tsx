'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { CharacterDisplay } from './character-display'
import { PinyinInput } from './pinyin-input'
import { ToneSelector } from './tone-selector'
import { PinyinFeedback } from './pinyin-feedback'
import { comparePinyinExact } from '@/lib/utils/pinyin-utils'
import { calculateGradeFromTime } from '@/lib/utils/srs-algorithm'
import { cn } from '@/lib/utils/cn'

// Re-export types for external use
export type { ReviewCardProps, ReviewResult } from './review-card.types'

// Import ReviewCardProps for internal use in the component
type ReviewCardPropsInternal = import('./review-card.types').ReviewCardProps

/**
 * Review Card Component (Apple-inspired minimal design)
 *
 * Main component for reviewing items. Shows character and collects pinyin answer.
 * Clean, minimal design with generous spacing and subtle feedback.
 *
 * Flow:
 * 1. Show character
 * 2. User types pinyin + selects tone
 * 3. User submits answer
 * 4. Show feedback (correct/incorrect)
 * 5. User clicks "Next" to continue
 */

export const ReviewCard = memo(function ReviewCard({
  character,
  meaning,
  correctPinyin,
  itemType,
  onSubmit,
  onSkip,
}: ReviewCardPropsInternal) {
  // State
  const [userInput, setUserInput] = useState('')
  const [selectedTone, setSelectedTone] = useState<number | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [startTime, setStartTime] = useState(Date.now())

  // Refs to prevent double-submission
  const isSubmittingRef = useRef(false)

  // Reset state when character changes
  useEffect(() => {
    setUserInput('')
    setSelectedTone(null)
    setIsAnswerSubmitted(false)
    setIsCorrect(null)
    setStartTime(Date.now())
    isSubmittingRef.current = false
  }, [character])

  /**
   * Handle answer submission
   */
  const handleSubmitAnswer = useCallback(() => {
    if (isSubmittingRef.current || isAnswerSubmitted) {
      return
    }

    if (!userInput.trim()) {
      return
    }

    isSubmittingRef.current = true

    const answeredCorrectly = comparePinyinExact(userInput, correctPinyin)

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

    onSubmit({
      userAnswer: userInput,
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
                selectedTone={selectedTone}
                onToneChange={setSelectedTone}
                disabled={isAnswerSubmitted}
                onSubmit={handleSubmitAnswer}
                autoFocus
              />

              <ToneSelector
                selectedTone={selectedTone}
                onToneSelect={setSelectedTone}
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
                userAnswer={userInput}
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
