'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * Pinyin Feedback Component
 *
 * Shows visual feedback for pinyin input:
 * - Correct: Green checkmark
 * - Incorrect: Red X with correct answer
 * - Close: Orange warning with hint
 */

interface PinyinFeedbackProps {
  isCorrect: boolean | null
  userAnswer: string
  correctAnswer: string
  isClose?: boolean // For answers that are close but not exact
  show: boolean
}

export function PinyinFeedback({
  isCorrect,
  userAnswer,
  correctAnswer,
  isClose = false,
  show,
}: PinyinFeedbackProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isCorrect && show) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }, [isCorrect, show])

  if (!show || isCorrect === null) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {/* Correct */}
        {isCorrect && (
          <div
            className={cn(
              'rounded-lg p-4',
              'bg-green-100 dark:bg-green-900/20',
              'border-2 border-green-500',
              'text-green-800 dark:text-green-200',
              'flex items-center justify-center gap-3'
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <Check className="h-6 w-6" />
            </motion.div>
            <div className="text-lg font-semibold">Correct! {userAnswer}</div>
          </div>
        )}

        {/* Incorrect */}
        {!isCorrect && !isClose && (
          <div
            className={cn(
              'rounded-lg p-4',
              'bg-red-100 dark:bg-red-900/20',
              'border-2 border-red-500',
              'text-red-800 dark:text-red-200',
              'space-y-2'
            )}
          >
            <div className="flex items-center justify-center gap-3">
              <X className="h-6 w-6" />
              <div className="text-lg font-semibold">Not quite right</div>
            </div>

            <div className="space-y-1 text-center">
              <div className="text-sm">
                You typed: <span className="font-mono font-bold">{userAnswer}</span>
              </div>
              <div className="text-sm">
                Correct answer: <span className="font-mono text-xl font-bold">{correctAnswer}</span>
              </div>
            </div>
          </div>
        )}

        {/* Close but not exact */}
        {!isCorrect && isClose && (
          <div
            className={cn(
              'rounded-lg p-4',
              'bg-orange-100 dark:bg-orange-900/20',
              'border-2 border-orange-500',
              'text-orange-800 dark:text-orange-200',
              'space-y-2'
            )}
          >
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className="h-6 w-6" />
              <div className="text-lg font-semibold">Almost! Check the tone</div>
            </div>

            <div className="space-y-1 text-center">
              <div className="text-sm">
                You typed: <span className="font-mono font-bold">{userAnswer}</span>
              </div>
              <div className="text-sm">
                Correct: <span className="font-mono text-xl font-bold">{correctAnswer}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                The pinyin is right, but the tone is different
              </div>
            </div>
          </div>
        )}

        {/* Confetti effect */}
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-primary"
                initial={{
                  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
                  y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
                  opacity: 1,
                }}
                animate={{
                  x:
                    typeof window !== 'undefined'
                      ? Math.random() * window.innerWidth
                      : Math.random() * 800,
                  y:
                    typeof window !== 'undefined'
                      ? Math.random() * window.innerHeight
                      : Math.random() * 600,
                  opacity: 0,
                }}
                transition={{
                  duration: 1,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
