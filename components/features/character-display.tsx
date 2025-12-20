'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { useMotionPreference } from '@/lib/utils/motion-config'

/**
 * Character Display Component
 *
 * Shows the Chinese character in large, readable font.
 * Also shows English meaning for context.
 * Supports visual feedback states for answer correctness.
 */

interface CharacterDisplayProps {
  character: string
  meaning: string
  itemType: 'radical' | 'character' | 'vocabulary'
  showMeaning?: boolean
  className?: string
  feedbackState?: 'correct' | 'incorrect' | null
}

export function CharacterDisplay({
  character,
  meaning,
  itemType,
  showMeaning = true,
  className,
  feedbackState = null,
}: CharacterDisplayProps) {
  const prefersReducedMotion = useMotionPreference()

  return (
    <div className={cn('space-y-2 text-center', className)}>
      {/* Item type badge */}
      <div className="flex justify-center">
        <span
          className={cn(
            'inline-block rounded-full px-3 py-1 text-xs font-medium',
            itemType === 'radical' &&
              'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
            itemType === 'character' &&
              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
            itemType === 'vocabulary' &&
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
          )}
        >
          {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
        </span>
      </div>

      {/* Character with smooth feedback transitions */}
      <motion.div
        className={cn(
          'character-display chinese-text',
          'select-none', // Prevent accidental copying
          'py-8',
          'duration-[400ms] transition-all ease-out'
        )}
        animate={{
          color:
            feedbackState === 'correct'
              ? '#22c55e'
              : feedbackState === 'incorrect'
                ? 'currentColor'
                : 'currentColor',
          opacity: feedbackState === 'incorrect' ? 0.6 : 1,
          filter: feedbackState === 'correct' ? 'brightness(1.1)' : 'brightness(1)',
        }}
        transition={{
          duration: prefersReducedMotion ? 0.15 : 0.4,
          ease: 'easeOut',
        }}
      >
        {character}
      </motion.div>

      {/* Meaning */}
      {showMeaning && <div className="text-lg text-muted-foreground">{meaning}</div>}
    </div>
  )
}
