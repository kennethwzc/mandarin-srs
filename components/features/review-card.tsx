'use client'

import { useState, useEffect, useCallback, memo } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { CharacterDisplay } from './character-display'
import { PinyinInput } from './pinyin-input'
import { ToneSelector } from './tone-selector'
import { GradeButtons } from './grade-buttons'
import { PinyinFeedback } from './pinyin-feedback'
import { comparePinyinFlexible, comparePinyinIgnoreTones } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'

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
 * 5. User grades themselves
 * 6. Card flips/transitions to next item
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

interface ReviewCardProps {
  // Item data
  character: string // Character to review (你, 好, etc.)
  meaning: string // English meaning
  correctPinyin: string // Correct answer (nǐ, hǎo, etc.)
  itemType: 'radical' | 'character' | 'vocabulary'

  // Callbacks
  onSubmit: (result: ReviewResult) => void // Called when review is graded
  onSkip?: () => void // Optional skip functionality
}

export interface ReviewResult {
  userAnswer: string // What user typed
  isCorrect: boolean // Whether answer was correct
  grade: number // 0-3 (Again, Hard, Good, Easy)
  responseTimeMs: number // Time taken to answer
}

export const ReviewCard = memo(function ReviewCard({
  character,
  meaning,
  correctPinyin,
  itemType,
  onSubmit,
  onSkip,
}: ReviewCardProps) {
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
   * Handle self-grading
   * Called when user clicks Again/Hard/Good/Easy
   */
  const handleGrade = useCallback(
    (grade: number) => {
      const responseTime = Date.now() - startTime

      onSubmit({
        userAnswer: userInput,
        isCorrect: isCorrect ?? false,
        grade,
        responseTimeMs: responseTime,
      })

      // Reset for next card (parent will provide new character)
    },
    [userInput, isCorrect, startTime, onSubmit]
  )

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter to submit answer
      if (e.key === 'Enter' && !isAnswerSubmitted) {
        handleSubmitAnswer()
      }

      // Escape to skip (if enabled)
      if (e.key === 'Escape' && onSkip && !isAnswerSubmitted) {
        onSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isAnswerSubmitted, handleSubmitAnswer, onSkip])

  return (
    <Card
      className={cn(
        'mx-auto w-full max-w-2xl',
        'transition-all duration-300',
        isAnswerSubmitted && 'shadow-lg'
      )}
    >
      <CardContent className="space-y-6 p-8">
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
                  'rounded-lg px-8 py-3 font-medium',
                  'bg-primary text-primary-foreground',
                  'transition-colors hover:bg-primary/90',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                )}
              >
                Check Answer
                <span className="ml-2 text-sm opacity-70">(Enter)</span>
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

            {/* Self-Grading Buttons */}
            <GradeButtons onGrade={handleGrade} isCorrect={isCorrect ?? false} />
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
