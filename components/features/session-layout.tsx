/**
 * Session Layout Component
 *
 * Shared layout wrapper for practice and review sessions.
 * Provides consistent UI for loading, error, and completion states.
 *
 * Dependencies: react, ui/button, ui/progress
 */

'use client'

import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

/**
 * Props for loading state
 */
interface LoadingStateProps {
  /** Loading message to display */
  message?: string
}

/**
 * Loading state component for sessions
 */
export function SessionLoading({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

/**
 * Props for error state
 */
interface ErrorStateProps {
  /** Error message to display */
  message: string
  /** Primary action button handler */
  onPrimaryAction: () => void
  /** Primary action button text */
  primaryActionText: string
  /** Optional secondary action handler */
  onSecondaryAction?: () => void
  /** Optional secondary action text */
  secondaryActionText?: string
}

/**
 * Error state component for sessions
 */
export function SessionError({
  message,
  onPrimaryAction,
  primaryActionText,
  onSecondaryAction,
  secondaryActionText,
}: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 text-center sm:p-8">
      <div className="mb-4 text-5xl">😕</div>
      <h1 className="text-2xl font-bold sm:text-3xl">Unable to Load</h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        <Button onClick={onPrimaryAction}>{primaryActionText}</Button>
        {onSecondaryAction && secondaryActionText && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Props for empty state (no items)
 */
interface EmptyStateProps {
  /** Message to display */
  message: string
  /** Action button handler */
  onAction: () => void
  /** Action button text */
  actionText: string
}

/**
 * Empty state component for sessions
 */
export function SessionEmpty({ message, onAction, actionText }: EmptyStateProps) {
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Button onClick={onAction} className="mt-4">
        {actionText}
      </Button>
    </div>
  )
}

/**
 * Props for session completion state
 */
interface CompletionStateProps {
  /** Title to display */
  title: string
  /** Emoji to display */
  emoji: string
  /** Description text */
  description?: string
  /** Statistics to display */
  stats?: {
    label: string
    value: number | string
    suffix?: string
    color?: string
  }[]
  /** Action buttons */
  actions: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }[]
}

/**
 * Session completion component
 */
export function SessionComplete({
  title,
  emoji,
  description,
  stats,
  actions,
}: CompletionStateProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 text-center sm:p-8">
      <div className="mb-4 text-5xl sm:text-6xl">{emoji}</div>
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>

      {stats && stats.length > 0 && (
        <div className="mx-auto grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg bg-muted p-4">
              <div className={`text-2xl font-bold sm:text-3xl ${stat.color || 'text-primary'}`}>
                {stat.value}
                {stat.suffix}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {description && (
        <p className="px-2 text-sm text-muted-foreground sm:px-0 sm:text-base">{description}</p>
      )}

      <div className="flex flex-col justify-center gap-3 px-4 sm:flex-row sm:gap-4 sm:px-0">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'default'}
            onClick={action.onClick}
            className="w-full sm:w-auto"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Props for session progress bar
 */
interface ProgressBarProps {
  /** Current item index (0-based) */
  currentIndex: number
  /** Total number of items */
  totalItems: number
  /** Label prefix (e.g., "Progress", "Practice Progress") */
  label?: string
}

/**
 * Session progress bar component
 */
export function SessionProgressBar({
  currentIndex,
  totalItems,
  label = 'Progress',
}: ProgressBarProps) {
  const progress = totalItems > 0 ? ((currentIndex + 1) / totalItems) * 100 : 0

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 px-4 sm:px-0">
      <div className="flex justify-between text-xs text-muted-foreground sm:text-sm">
        <span>{label}</span>
        <span>
          {currentIndex + 1} / {totalItems}
        </span>
      </div>
      <Progress
        value={progress}
        className="h-2"
        aria-label={`${label}: ${currentIndex + 1} of ${totalItems} items`}
      />
    </div>
  )
}

/**
 * Props for session stats display
 */
interface StatsDisplayProps {
  /** Number of correct answers */
  correctCount: number
  /** Total items reviewed */
  totalReviewed: number
  /** Optional additional label (e.g., "Practice mode") */
  additionalLabel?: string
  /** Color for additional label */
  additionalLabelColor?: string
}

/**
 * Session stats display component
 */
export function SessionStatsDisplay({
  correctCount,
  totalReviewed,
  additionalLabel,
  additionalLabelColor = 'text-blue-500',
}: StatsDisplayProps) {
  const accuracy = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0

  return (
    <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2 px-4 text-xs text-muted-foreground sm:gap-4 sm:px-0 sm:text-sm">
      <span>✓ {correctCount} correct</span>
      <span>• {totalReviewed} total</span>
      {totalReviewed > 0 && <span>• {accuracy}% accuracy</span>}
      {additionalLabel && <span className={additionalLabelColor}>• {additionalLabel}</span>}
    </div>
  )
}

/**
 * Props for main session layout wrapper
 */
interface SessionLayoutProps {
  /** Child content to render */
  children: ReactNode
}

/**
 * Main session layout wrapper
 */
export function SessionLayout({ children }: SessionLayoutProps) {
  return <div className="space-y-4 sm:space-y-6">{children}</div>
}
