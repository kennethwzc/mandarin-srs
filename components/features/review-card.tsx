'use client'

import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { CharacterDisplay } from './character-display'
import { PinyinInput } from './pinyin-input'
import { comparePinyinExact } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'

export interface ReviewCardProps {
  character: string
  correctPinyin: string
  onAnswer: (isCorrect: boolean) => void
  showAnswer?: boolean
}

/**
 * Review card component for spaced repetition
 * Shows character and pinyin input
 */
export function ReviewCard({ character, correctPinyin, onAnswer }: ReviewCardProps) {
  const [userInput, setUserInput] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!userInput.trim()) {
      return
    }

    const correct = comparePinyinExact(userInput, correctPinyin)
    setIsCorrect(correct)
    setHasSubmitted(true)
    onAnswer(correct)
  }

  const handleInputChange = (value: string) => {
    setUserInput(value)
    if (hasSubmitted) {
      setHasSubmitted(false)
      setIsCorrect(null)
    }
  }

  return (
    <Card className="review-card-container h-[500px] w-full max-w-2xl">
      <div className="flex h-full flex-col items-center justify-center space-y-8 p-8">
        <CharacterDisplay character={character} />

        <div className="w-full max-w-md space-y-4">
          <PinyinInput
            value={userInput}
            onChange={handleInputChange}
            onEnter={handleSubmit}
            placeholder="Type the pinyin..."
            disabled={hasSubmitted}
          />

          {hasSubmitted && (
            <div
              className={cn(
                'rounded-lg p-4 text-center text-lg font-semibold',
                isCorrect
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              )}
            >
              {isCorrect ? (
                <span>✓ Correct! The answer is: {correctPinyin}</span>
              ) : (
                <span>✗ Incorrect. The correct answer is: {correctPinyin}</span>
              )}
            </div>
          )}

          {!hasSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
