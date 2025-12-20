'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { useMotionPreference } from '@/lib/utils/motion-config'

import { Card, CardContent } from '@/components/ui/card'
import { CharacterDisplay } from './character-display'
import { PinyinInput } from './pinyin-input'
import { ToneSelector } from './tone-selector'
import { PinyinFeedback } from './pinyin-feedback'
import { comparePinyinFlexible, comparePinyinIgnoreTones } from '@/lib/utils/pinyin-utils'
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
  const [isClose, setIsClose] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  // Reset state when character changes
  useEffect(() => {
    setUserInput('')
    setSelectedTone(null)
    setIsAnswerSubmitted(false)
    setIsCorrect(null)
    setIsClose(false)
    setStartTime(Date.now()) // Reset start time for accurate response time calculation
  }, [character])

  /**
   * Handle answer submission
   * Checks if answer is correct and shows feedback
   */
  const handleSubmitAnswer = useCallback(() => {
    if (!userInput.trim()) {
      return // Don't submit empty answers
    }

    // Check if answer is correct (flexible comparison)
    const answeredCorrectly = comparePinyinFlexible(userInput, correctPinyin)

    // Check if close (right pinyin, wrong tone)
    const answerIsClose = !answeredCorrectly && comparePinyinIgnoreTones(userInput, correctPinyin)

    setIsCorrect(answeredCorrectly)
    setIsClose(answerIsClose)
    setIsAnswerSubmitted(true)

    // Remove focus from input to allow Enter key to continue to next card
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [userInput, correctPinyin])

  /**
   * Handle continue/next - automatically calculates grade based on response time
   * Called when user clicks "Next" after seeing feedback
   */
  const handleContinue = useCallback(() => {
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
  }, [userInput, isCorrect, startTime, onSubmit, character.length])

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
            isCorrect === false &&
            !isClose && [
              'shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-2 ring-red-500/50',
              'bg-red-50/30 dark:bg-red-950/15',
            ],
          isAnswerSubmitted &&
            isClose && [
              'shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-2 ring-orange-500/50',
              'bg-orange-50/30 dark:bg-orange-950/15',
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
            feedbackState={
              !isAnswerSubmitted ? null : isCorrect ? 'correct' : isClose ? 'almost' : 'incorrect'
            }
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
                isClose={isClose}
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
