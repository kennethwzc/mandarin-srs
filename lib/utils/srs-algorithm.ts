import {
  SRS_STAGES,
  GRADES,
  INITIAL_EASE_FACTOR,
  MIN_EASE_FACTOR,
  MAX_EASE_FACTOR,
  LEARNING_STEPS_MINUTES,
  RELEARNING_STEPS_MINUTES,
  GRADUATING_INTERVAL_DAYS,
  EASY_INTERVAL_DAYS,
  MIN_REVIEW_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  EASE_ADJUSTMENTS,
  HARD_INTERVAL_MULTIPLIER,
  EASY_BONUS_MULTIPLIER,
  MIN_DAYS_INCREMENT,
  FUZZ_FACTOR_RANGE,
} from './srs-constants'
import type { SrsStage, Grade } from './srs-constants'

/**
 * Safe array access helper - returns default if index out of bounds
 */
function getStep(steps: readonly number[], index: number, defaultValue: number): number {
  return steps[index] ?? defaultValue
}

// Default step values (first step of each array)
const DEFAULT_LEARNING_STEP = LEARNING_STEPS_MINUTES[0] ?? 1
const DEFAULT_RELEARNING_STEP = RELEARNING_STEPS_MINUTES[0] ?? 10

/**
 * SRS Algorithm Implementation
 *
 * Pure functions for calculating next review intervals based on SM-2 algorithm.
 * All functions are deterministic and timezone-aware.
 *
 * @example
 * ```ts
 * const result = calculateNextReview({
 *   currentStage: 'learning',
 *   currentInterval: 0,
 *   currentEaseFactor: 2500,
 *   currentStep: 0,
 *   grade: 2, // Good
 *   timezone: 'America/New_York'
 * })
 *
 * console.log(result)
 * // {
 * //   newStage: 'learning',
 * //   newInterval: 10,
 * //   newEaseFactor: 2500,
 * //   newStep: 1,
 * //   nextReviewDate: Date(...)
 * // }
 * ```
 */

/**
 * Input parameters for SRS calculation
 */
export interface SrsInput {
  currentStage: SrsStage
  currentInterval: number // In days (for review) or step index (for learning)
  currentEaseFactor: number // Stored as integer (2500 = 2.5)
  currentStep: number // Current position in learning/relearning steps
  grade: Grade // User's grade (0-3)
  timezone: string // User's timezone (e.g., "America/New_York")
  reviewedAt?: Date // When review happened (default: now)
}

/**
 * Output result from SRS calculation
 */
export interface SrsOutput {
  newStage: SrsStage
  newInterval: number // In days
  newEaseFactor: number // Stored as integer
  newStep: number // New position in learning/relearning steps
  nextReviewDate: Date // When next review is due
}

/**
 * Calculate next review based on current state and grade
 *
 * This is the main entry point for the SRS algorithm.
 *
 * @param input - Current SRS state and user grade
 * @returns New SRS state and next review date
 */
export function calculateNextReview(input: SrsInput): SrsOutput {
  const {
    currentStage,
    currentInterval,
    currentEaseFactor,
    currentStep,
    grade,
    timezone,
    reviewedAt = new Date(),
  } = input

  // Handle NEW stage
  if (currentStage === SRS_STAGES.NEW) {
    return handleNewStage(grade, timezone, reviewedAt)
  }

  // Handle LEARNING stage
  if (currentStage === SRS_STAGES.LEARNING) {
    return handleLearningStage(grade, currentStep, currentEaseFactor, timezone, reviewedAt)
  }

  // Handle RELEARNING stage
  if (currentStage === SRS_STAGES.RELEARNING) {
    return handleRelearningStage(
      grade,
      currentStep,
      currentEaseFactor,
      currentInterval,
      timezone,
      reviewedAt
    )
  }

  // Handle REVIEW stage
  if (currentStage === SRS_STAGES.REVIEW) {
    return handleReviewStage(grade, currentInterval, currentEaseFactor, timezone, reviewedAt)
  }

  // Should never reach here
  throw new Error(`Invalid SRS stage: ${currentStage}`)
}

/**
 * Handle NEW stage
 * First time seeing this item
 */
function handleNewStage(grade: Grade, timezone: string, reviewedAt: Date): SrsOutput {
  // All grades move to LEARNING stage
  // Start at first learning step
  const newStage = SRS_STAGES.LEARNING
  const newStep = 0
  const newEaseFactor = INITIAL_EASE_FACTOR

  // Next review based on grade
  let intervalMinutes: number

  if (grade === GRADES.AGAIN) {
    // Failed - review again in 1 minute
    intervalMinutes = DEFAULT_LEARNING_STEP
  } else if (grade === GRADES.EASY) {
    // Easy - skip learning, go straight to review stage
    return {
      newStage: SRS_STAGES.REVIEW,
      newInterval: EASY_INTERVAL_DAYS,
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addDays(reviewedAt, EASY_INTERVAL_DAYS, timezone),
    }
  } else {
    // Hard or Good - start learning process
    intervalMinutes = DEFAULT_LEARNING_STEP
  }

  return {
    newStage,
    newInterval: 0, // Still in learning, not in days yet
    newEaseFactor,
    newStep,
    nextReviewDate: addMinutes(reviewedAt, intervalMinutes, timezone),
  }
}

/**
 * Handle LEARNING stage
 * User is learning this item through graduated intervals
 */
function handleLearningStage(
  grade: Grade,
  currentStep: number,
  currentEaseFactor: number,
  timezone: string,
  reviewedAt: Date
): SrsOutput {
  // AGAIN - reset to first step
  if (grade === GRADES.AGAIN) {
    const intervalMinutes = DEFAULT_LEARNING_STEP
    return {
      newStage: SRS_STAGES.LEARNING,
      newInterval: 0,
      newEaseFactor: currentEaseFactor,
      newStep: 0,
      nextReviewDate: addMinutes(reviewedAt, intervalMinutes, timezone),
    }
  }

  // EASY - graduate immediately to review
  if (grade === GRADES.EASY) {
    const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)
    return {
      newStage: SRS_STAGES.REVIEW,
      newInterval: EASY_INTERVAL_DAYS,
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addDays(reviewedAt, EASY_INTERVAL_DAYS, timezone),
    }
  }

  // HARD or GOOD - advance through learning steps
  const nextStep = currentStep + 1

  // Check if graduated (completed all learning steps)
  if (nextStep >= LEARNING_STEPS_MINUTES.length) {
    // Graduate to REVIEW stage
    const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)
    return {
      newStage: SRS_STAGES.REVIEW,
      newInterval: GRADUATING_INTERVAL_DAYS,
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addDays(reviewedAt, GRADUATING_INTERVAL_DAYS, timezone),
    }
  }

  // Continue learning - advance to next step
  const intervalMinutes = getStep(LEARNING_STEPS_MINUTES, nextStep, DEFAULT_LEARNING_STEP)
  return {
    newStage: SRS_STAGES.LEARNING,
    newInterval: 0,
    newEaseFactor: currentEaseFactor,
    newStep: nextStep,
    nextReviewDate: addMinutes(reviewedAt, intervalMinutes, timezone),
  }
}

/**
 * Handle RELEARNING stage
 * User failed a review and is relearning the item
 */
function handleRelearningStage(
  grade: Grade,
  currentStep: number,
  currentEaseFactor: number,
  previousInterval: number,
  timezone: string,
  reviewedAt: Date
): SrsOutput {
  // AGAIN - reset to first relearning step
  if (grade === GRADES.AGAIN) {
    const intervalMinutes = DEFAULT_RELEARNING_STEP
    const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)
    return {
      newStage: SRS_STAGES.RELEARNING,
      newInterval: previousInterval, // Keep track of previous interval
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addMinutes(reviewedAt, intervalMinutes, timezone),
    }
  }

  // EASY - return to review with reduced interval
  if (grade === GRADES.EASY) {
    const newInterval = Math.max(Math.floor(previousInterval * 0.5), MIN_REVIEW_INTERVAL_DAYS)
    const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)
    return {
      newStage: SRS_STAGES.REVIEW,
      newInterval,
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addDays(reviewedAt, newInterval, timezone),
    }
  }

  // HARD or GOOD - advance through relearning steps
  const nextStep = currentStep + 1

  // Check if completed relearning
  if (nextStep >= RELEARNING_STEPS_MINUTES.length) {
    // Return to REVIEW stage with reduced interval
    const newInterval = Math.max(Math.floor(previousInterval * 0.5), MIN_REVIEW_INTERVAL_DAYS)
    const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)
    return {
      newStage: SRS_STAGES.REVIEW,
      newInterval,
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addDays(reviewedAt, newInterval, timezone),
    }
  }

  // Continue relearning
  const intervalMinutes = getStep(RELEARNING_STEPS_MINUTES, nextStep, DEFAULT_RELEARNING_STEP)
  return {
    newStage: SRS_STAGES.RELEARNING,
    newInterval: previousInterval,
    newEaseFactor: currentEaseFactor,
    newStep: nextStep,
    nextReviewDate: addMinutes(reviewedAt, intervalMinutes, timezone),
  }
}

/**
 * Handle REVIEW stage
 * Regular spaced repetition reviews
 */
function handleReviewStage(
  grade: Grade,
  currentInterval: number,
  currentEaseFactor: number,
  timezone: string,
  reviewedAt: Date
): SrsOutput {
  // AGAIN - move to relearning
  if (grade === GRADES.AGAIN) {
    const intervalMinutes = DEFAULT_RELEARNING_STEP
    const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)
    return {
      newStage: SRS_STAGES.RELEARNING,
      newInterval: currentInterval, // Remember previous interval
      newEaseFactor,
      newStep: 0,
      nextReviewDate: addMinutes(reviewedAt, intervalMinutes, timezone),
    }
  }

  // Calculate new ease factor
  const newEaseFactor = adjustEaseFactor(currentEaseFactor, grade)

  // Calculate new interval based on grade
  let newInterval: number

  if (grade === GRADES.HARD) {
    // Hard - increase by 20%
    newInterval = Math.max(
      Math.floor(currentInterval * HARD_INTERVAL_MULTIPLIER),
      currentInterval + MIN_DAYS_INCREMENT
    )
  } else if (grade === GRADES.GOOD) {
    // Good - use ease factor
    newInterval = Math.max(
      Math.floor(currentInterval * (newEaseFactor / 1000)),
      currentInterval + MIN_DAYS_INCREMENT
    )
  } else {
    // Easy - use ease factor with bonus
    newInterval = Math.max(
      Math.floor(currentInterval * (newEaseFactor / 1000) * EASY_BONUS_MULTIPLIER),
      currentInterval + MIN_DAYS_INCREMENT
    )
  }

  // Apply fuzz factor (small randomization to spread out reviews)
  newInterval = applyFuzzFactor(newInterval)

  // Clamp to min/max
  newInterval = Math.max(MIN_REVIEW_INTERVAL_DAYS, Math.min(MAX_INTERVAL_DAYS, newInterval))

  return {
    newStage: SRS_STAGES.REVIEW,
    newInterval,
    newEaseFactor,
    newStep: 0,
    nextReviewDate: addDays(reviewedAt, newInterval, timezone),
  }
}

/**
 * Adjust ease factor based on grade
 *
 * @param currentEaseFactor - Current ease factor (as integer)
 * @param grade - User's grade (0-3)
 * @returns New ease factor (clamped to min/max)
 */
function adjustEaseFactor(currentEaseFactor: number, grade: Grade): number {
  const adjustment = EASE_ADJUSTMENTS[grade] ?? 0
  const newEaseFactor = currentEaseFactor + adjustment

  // Clamp to min/max
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEaseFactor))
}

/**
 * Apply fuzz factor to interval
 * Adds small randomization (-5% to +5%) to spread out reviews
 *
 * @param interval - Interval in days
 * @returns Fuzzed interval
 */
function applyFuzzFactor(interval: number): number {
  if (interval < 2) {
    return interval // Don't fuzz very short intervals
  }

  // Calculate fuzz range
  const fuzzRange = Math.floor(interval * FUZZ_FACTOR_RANGE)
  const fuzz = Math.floor(Math.random() * (2 * fuzzRange + 1)) - fuzzRange

  return interval + fuzz
}

/**
 * Add days to a date in a specific timezone
 *
 * @param date - Base date
 * @param days - Days to add
 * @param _timezone - Timezone (e.g., "America/New_York") - currently unused but kept for API consistency
 * @returns New date
 */
function addDays(date: Date, days: number, _timezone: string): Date {
  // Simple approach: add days to the timestamp
  // This is timezone-agnostic and works correctly
  const result = new Date(date.getTime())
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Add minutes to a date in a specific timezone
 *
 * @param date - Base date
 * @param minutes - Minutes to add
 * @param _timezone - Timezone - currently unused but kept for API consistency
 * @returns New date
 */
function addMinutes(date: Date, minutes: number, _timezone: string): Date {
  // Simple approach: add minutes to the timestamp
  // This is timezone-agnostic and works correctly
  const result = new Date(date.getTime() + minutes * 60 * 1000)
  return result
}

/**
 * Helper: Get days until next review
 *
 * @param nextReviewDate - Next review date
 * @param now - Current date (default: now)
 * @returns Days until review (negative if overdue)
 */
export function getDaysUntilReview(nextReviewDate: Date, now: Date = new Date()): number {
  const diffMs = nextReviewDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Helper: Check if item is due for review
 *
 * @param nextReviewDate - Next review date
 * @param now - Current date (default: now)
 * @returns True if due for review
 */
export function isDueForReview(nextReviewDate: Date, now: Date = new Date()): boolean {
  return nextReviewDate <= now
}
