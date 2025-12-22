'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMotionPreference } from '@/lib/utils/motion-config'

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
 * Review Card Component (Optimized with React.memo)
 *
 * Main component for reviewing items. Shows character and collects pinyin answer.
 * Memoized to prevent unnecessary re-renders.
 *
 * Flow:
 * 1. Show character
 * 2. User types pinyin + selects tone
 * 3. User submits answer
 * 4. Show feedback (correct/incorrect)
 * 5. Grade auto-calculated from response time (0-5s/char = Easy, 5-10s/char = Good, >10s/char = Hard)
 * 6. User clicks "Next" to continue
 * 7. Card transitions to next item
 *
 * @example
 * ```tsx
 * <ReviewCard
 *   character="你"
 *   meaning="you"
 *   correctPinyin="nǐ"
 *   onSubmit={handleSubmit}
 * />
 * ```
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
    setStartTime(Date.now()) // Reset start time for accurate response time calculation
    isSubmittingRef.current = false // Reset submission guard
  }, [character])

  /**
   * Handle answer submission
   * Checks if answer is correct and shows feedback
   */
  const handleSubmitAnswer = useCallback(() => {
    // Prevent double-submission
    if (isSubmittingRef.current || isAnswerSubmitted) {
      return
    }

    if (!userInput.trim()) {
      return // Don't submit empty answers
    }

    // Mark as submitting to prevent double-submission
    isSubmittingRef.current = true

    // Check if answer is correct (exact comparison)
    const answeredCorrectly = comparePinyinExact(userInput, correctPinyin)

    // Debug logging to verify state updates
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 ReviewCard state:', {
        userInput,
        correctPinyin,
        answeredCorrectly,
        isAnswerSubmitted: true,
        component: 'ReviewCard',
      })
    }

    setIsCorrect(answeredCorrectly)
    setIsAnswerSubmitted(true)

    // Remove focus from input to allow Enter key to continue to next card
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    // Reset submission guard after state update completes
    // Use setTimeout to ensure state update has been processed
    setTimeout(() => {
      isSubmittingRef.current = false
    }, 100)
  }, [userInput, correctPinyin, isAnswerSubmitted])

  /**
   * Handle continue/next - automatically calculates grade based on response time
   * Called when user clicks "Next" after seeing feedback
   */
  const handleContinue = useCallback(() => {
    // Guard: Only allow continuing if feedback has been shown
    if (!isAnswerSubmitted || isCorrect === null) {
      return
    }

    const responseTime = Date.now() - startTime
    const correct = isCorrect ?? false

    // Auto-calculate grade based on response time and character count
    const autoGrade = calculateGradeFromTime(responseTime, character.length, correct)

    onSubmit({
      userAnswer: userInput,
      isCorrect: correct,
      grade: autoGrade,
      responseTimeMs: responseTime,
    })

    // Reset for next card (parent will provide new character)
  }, [userInput, isCorrect, startTime, onSubmit, character.length, isAnswerSubmitted])

  /**
   * Keyboard shortcuts
   * Only handles window-level events when input is not focused
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle if input is focused (PinyinInput handles it)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      // Enter to submit answer or continue to next card
      if (e.key === 'Enter') {
        if (!isAnswerSubmitted) {
          handleSubmitAnswer()
        } else {
          handleContinue()
        }
      }

      // Escape to skip (if enabled)
      if (e.key === 'Escape' && onSkip && !isAnswerSubmitted) {
        onSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isAnswerSubmitted, handleSubmitAnswer, handleContinue, onSkip])

  const prefersReducedMotion = useMotionPreference()

  return (
    <motion.div
      initial={false}
      animate={
        isAnswerSubmitted
          ? {
              scale: prefersReducedMotion ? 1 : 1.01,
              transition: {
                duration: prefersReducedMotion ? 0.15 : 0.3,
                ease: 'easeOut',
              },
            }
          : { scale: 1 }
      }
    >
      <Card
        className={cn(
          'mx-auto w-full max-w-2xl overflow-hidden',
          'duration-[400ms] transition-all ease-out',
          // Card-level feedback styling
          isAnswerSubmitted &&
            isCorrect && [
              'shadow-[0_0_20px_rgba(34,197,94,0.25)] ring-2 ring-green-500/60',
              'bg-green-50/40 dark:bg-green-950/20',
            ],
          isAnswerSubmitted &&
            isCorrect === false && [
              'shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-2 ring-red-500/50',
              'bg-red-50/30 dark:bg-red-950/15',
            ]
        )}
      >
        <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8">
          {/* Character Display */}
          <CharacterDisplay
            character={character}
            meaning={meaning}
            itemType={itemType}
            showMeaning={!isAnswerSubmitted} // Hide meaning after submission
            feedbackState={!isAnswerSubmitted ? null : isCorrect ? 'correct' : 'incorrect'}
          />

          {/* Pinyin Input Section */}
          {!isAnswerSubmitted ? (
            <div className="space-y-4">
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

              <div className="flex justify-center">
                <motion.button
                  onClick={handleSubmitAnswer}
                  disabled={!userInput.trim()}
                  whileHover={
                    !prefersReducedMotion ? { scale: 1.02, transition: { duration: 0.2 } } : {}
                  }
                  whileTap={
                    !prefersReducedMotion ? { scale: 0.98, transition: { duration: 0.1 } } : {}
                  }
                  className={cn(
                    'min-h-[48px] w-full rounded-lg px-6 py-3 font-medium sm:w-auto sm:px-8',
                    'bg-primary text-primary-foreground shadow-md',
                    'transition-all duration-200 hover:bg-primary/90 hover:shadow-lg',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  )}
                >
                  Check Answer
                  <span className="ml-2 text-sm opacity-70 max-sm:hidden">(Enter)</span>
                </motion.button>
              </div>
            </div>
          ) : (
            /* Answer Feedback */
            <div className="space-y-6">
              {/* Pinyin Feedback Component */}
              <PinyinFeedback
                isCorrect={isCorrect}
                userAnswer={userInput}
                correctAnswer={correctPinyin}
                show={isAnswerSubmitted}
              />

              {/* Next button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={handleContinue}
                  whileHover={
                    !prefersReducedMotion ? { scale: 1.03, transition: { duration: 0.2 } } : {}
                  }
                  whileTap={
                    !prefersReducedMotion ? { scale: 0.98, transition: { duration: 0.1 } } : {}
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : 0.3,
                    duration: prefersReducedMotion ? 0.15 : 0.3,
                    ease: 'easeOut',
                  }}
                  className={cn(
                    'min-h-[48px] w-full rounded-lg px-6 py-3 font-medium sm:w-auto sm:px-12',
                    'bg-primary text-primary-foreground shadow-md',
                    'transition-all duration-200 hover:bg-primary/90 hover:shadow-lg',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  )}
                >
                  Next
                  <span className="ml-2 text-sm opacity-70 max-sm:hidden">(Enter)</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Skip button (optional) */}
          {onSkip && !isAnswerSubmitted && (
            <div className="text-center">
              <button
                onClick={onSkip}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip (Esc)
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})
