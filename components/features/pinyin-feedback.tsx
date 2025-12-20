'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useMotionPreference, getFeedbackVariant, getIconVariant } from '@/lib/utils/motion-config'

/**
 * Pinyin Feedback Component
 *
 * Shows visual feedback for pinyin input with smooth, elegant animations:
 * - Correct: Green checkmark with subtle radial gradient
 * - Incorrect: Red X with correct answer emphasis
 */

interface PinyinFeedbackProps {
  isCorrect: boolean | null
  userAnswer: string
  correctAnswer: string
  show: boolean
}

export function PinyinFeedback({
  isCorrect,
  userAnswer,
  correctAnswer,
  show,
}: PinyinFeedbackProps) {
  const prefersReducedMotion = useMotionPreference()
  const feedbackVariant = getFeedbackVariant(prefersReducedMotion)

  // Screen reader announcement text
  const announcementText = isCorrect
    ? `Correct! You answered ${userAnswer}`
    : `Incorrect. The correct answer is ${correctAnswer}`

  // Always render AnimatePresence, conditionally render children
  return (
    <AnimatePresence mode="wait">
      {show && isCorrect !== null && (
        <motion.div key="feedback-content" {...feedbackVariant} className="space-y-3">
          {/* Screen reader announcement */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {announcementText}
          </div>
          {/* Correct */}
          {isCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.15 : 0.4,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className={cn(
                'relative overflow-hidden rounded-lg p-4',
                'bg-gradient-to-br from-green-50 to-green-100/50',
                'dark:from-green-950/30 dark:to-green-900/20',
                'border-2 border-green-500/60 shadow-lg',
                'text-green-800 dark:text-green-200',
                'flex items-center justify-center gap-3'
              )}
            >
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-radial from-green-500/10 to-transparent" />

              <motion.div {...getIconVariant(prefersReducedMotion, 0.15)} className="relative z-10">
                <Check className="h-6 w-6" />
              </motion.div>
              <motion.div
                className="relative z-10 text-lg font-semibold"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.2,
                  duration: prefersReducedMotion ? 0.15 : 0.3,
                }}
              >
                Correct! {userAnswer}
              </motion.div>
            </motion.div>
          )}

          {/* Incorrect */}
          {!isCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.15 : 0.4,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className={cn(
                'relative overflow-hidden rounded-lg p-4',
                'bg-gradient-to-br from-red-50 to-red-100/30',
                'dark:from-red-950/20 dark:to-red-900/10',
                'border-2 border-red-500/50 shadow-md',
                'text-red-800 dark:text-red-200',
                'space-y-2'
              )}
            >
              <motion.div
                className="flex items-center justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.1,
                  duration: prefersReducedMotion ? 0.15 : 0.3,
                }}
              >
                <motion.div {...getIconVariant(prefersReducedMotion, 0.15)}>
                  <X className="h-6 w-6" />
                </motion.div>
                <div className="text-lg font-semibold">Not quite right</div>
              </motion.div>

              <motion.div
                className="space-y-1 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.25,
                  duration: prefersReducedMotion ? 0.15 : 0.3,
                }}
              >
                <div className="text-sm">
                  You typed: <span className="font-mono font-bold">{userAnswer}</span>
                </div>
                <motion.div
                  className="text-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : 0.35,
                    duration: prefersReducedMotion ? 0.15 : 0.3,
                  }}
                >
                  Correct answer:{' '}
                  <span className="font-mono text-xl font-bold text-red-600 dark:text-red-400">
                    {correctAnswer}
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
