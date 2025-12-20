'use client'

import { useState, useEffect, useCallback, memo } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { CharacterDisplay } from './character-display'
import { PinyinInput } from './pinyin-input'
import { ToneSelector } from './tone-selector'
import { PinyinFeedback } from './pinyin-feedback'
import { comparePinyinFlexible, comparePinyinIgnoreTones } from '@/lib/utils/pinyin-utils'
import { calculateGradeFromTime } from '@/lib/utils/srs-algorithm'
import { GRADES, TIME_THRESHOLDS } from '@/lib/utils/srs-constants'
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

    // Remove focus from input to allow keyboard shortcuts for grading (1-4 keys)
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
   * Get grade label and color for display
   */
  const getGradeDisplay = useCallback(() => {
    if (isCorrect === null) {
      return null
    }

    const responseTime = Date.now() - startTime
    const secondsPerChar = responseTime / 1000 / Math.max(character.length, 1)
    const grade = calculateGradeFromTime(responseTime, character.length, isCorrect)

    const gradeInfo = {
      [GRADES.AGAIN]: { label: 'Again', color: 'text-red-500', bgColor: 'bg-red-500/10' },
      [GRADES.HARD]: { label: 'Hard', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
      [GRADES.GOOD]: { label: 'Good', color: 'text-green-500', bgColor: 'bg-green-500/10' },
      [GRADES.EASY]: { label: 'Easy', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    }

    const info = gradeInfo[grade]
    return {
      ...info,
      secondsPerChar: secondsPerChar.toFixed(1),
      grade,
    }
  }, [isCorrect, startTime, character.length])

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

  return (
    <Card
      className={cn(
        'mx-auto w-full max-w-2xl',
        'transition-all duration-300',
        isAnswerSubmitted && 'shadow-lg'
      )}
    >
      <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8">
        {/* Character Display */}
        <CharacterDisplay
          character={character}
          meaning={meaning}
          itemType={itemType}
          showMeaning={!isAnswerSubmitted} // Hide meaning after submission
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
              <button
                onClick={handleSubmitAnswer}
                disabled={!userInput.trim()}
                className={cn(
                  'min-h-[48px] w-full rounded-lg px-6 py-3 font-medium sm:w-auto sm:px-8',
                  'bg-primary text-primary-foreground',
                  'transition-colors hover:bg-primary/90',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                )}
              >
                Check Answer
                <span className="ml-2 text-sm opacity-70 max-sm:hidden">(Enter)</span>
              </button>
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

            {/* Auto-calculated Grade Display */}
            {(() => {
              const gradeDisplay = getGradeDisplay()
              if (!gradeDisplay) {
                return null
              }

              return (
                <div className="space-y-4">
                  {/* Grade indicator */}
                  <div
                    className={cn(
                      'mx-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2',
                      gradeDisplay.bgColor
                    )}
                  >
                    <span className={cn('font-medium', gradeDisplay.color)}>
                      {gradeDisplay.label}
                    </span>
                    {isCorrect && (
                      <span className="text-sm text-muted-foreground">
                        ({gradeDisplay.secondsPerChar}s/char)
                      </span>
                    )}
                  </div>

                  {/* Time thresholds hint (only for correct answers) */}
                  {isCorrect && (
                    <p className="text-center text-xs text-muted-foreground">
                      &lt;{TIME_THRESHOLDS.EASY_MAX}s = Easy • {TIME_THRESHOLDS.EASY_MAX}-
                      {TIME_THRESHOLDS.GOOD_MAX}s = Good • &gt;{TIME_THRESHOLDS.GOOD_MAX}s = Hard
                    </p>
                  )}

                  {/* Next button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleContinue}
                      className={cn(
                        'min-h-[48px] w-full rounded-lg px-6 py-3 font-medium sm:w-auto sm:px-12',
                        'bg-primary text-primary-foreground',
                        'transition-all hover:scale-105 hover:bg-primary/90 active:scale-95',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      )}
                    >
                      Next
                      <span className="ml-2 text-sm opacity-70 max-sm:hidden">(Enter)</span>
                    </button>
                  </div>
                </div>
              )
            })()}
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
  )
})
