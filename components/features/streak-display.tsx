'use client'

import { memo } from 'react'
import { Flame } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

/**
 * Streak display component (Apple-inspired minimalist design)
 *
 * Shows daily practice streak with clean, minimal styling.
 * Uses subtle visual hierarchy instead of bright colors.
 */
export const StreakDisplay = memo(function StreakDisplay({
  currentStreak,
  longestStreak,
}: StreakDisplayProps) {
  const hasStreak = currentStreak > 0
  const isRecord = currentStreak >= longestStreak && currentStreak > 0

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-soft-md transition-all duration-base',
        isRecord && 'border-l-2 border-l-green-500 dark:border-l-green-400'
      )}
      role="region"
      aria-label="Learning streak status"
    >
      <div className="flex items-center justify-between">
        {/* Current streak */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              hasStreak ? 'bg-muted' : 'bg-muted/50'
            )}
          >
            <Flame
              className={cn('h-5 w-5', hasStreak ? 'text-foreground' : 'text-muted-foreground')}
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 ? 'Day streak' : 'Day streak'}
            </p>
          </div>
        </div>

        {/* Longest streak */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Longest streak</p>
          <p className="text-lg font-semibold text-foreground">
            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Motivational message - only when no streak */}
      {!hasStreak && (
        <p className="mt-4 text-sm text-muted-foreground">
          Complete a review session today to start your streak!
        </p>
      )}
    </div>
  )
})
