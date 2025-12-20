/**
 * SRS Algorithm Constants
 *
 * Based on SuperMemo SM-2 algorithm with modifications for Mandarin learning.
 * All constants are tuned for optimal retention while minimizing review burden.
 *
 * References:
 * - Original SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 * - Anki modifications: https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html
 */

/**
 * SRS Stages
 */
export const SRS_STAGES = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  RELEARNING: 'relearning',
} as const

export type SrsStage = (typeof SRS_STAGES)[keyof typeof SRS_STAGES]

/**
 * Review Grades
 * User's self-assessment of how well they knew the answer
 */
export const GRADES = {
  AGAIN: 0, // Complete failure - didn't know at all
  HARD: 1, // Difficult - barely remembered
  GOOD: 2, // Good - correct with reasonable effort
  EASY: 3, // Easy - instant recall
} as const

export type Grade = (typeof GRADES)[keyof typeof GRADES]

/**
 * Initial ease factor (2.5)
 * Stored as integer (2500) to avoid floating point issues
 * Actual value = ease_factor / 1000
 */
export const INITIAL_EASE_FACTOR = 2500 // 2.5

/**
 * Minimum ease factor (1.3)
 * Prevents intervals from becoming too short
 */
export const MIN_EASE_FACTOR = 1300 // 1.3

/**
 * Maximum ease factor (3.0)
 * Prevents intervals from growing too quickly
 */
export const MAX_EASE_FACTOR = 3000 // 3.0

/**
 * Learning steps (in minutes)
 * New items progress through these intervals in learning stage
 * [1 minute, 10 minutes]
 */
export const LEARNING_STEPS_MINUTES = [1, 10]

/**
 * Relearning steps (in minutes)
 * Failed reviews go through these steps
 * [10 minutes] - shorter than learning since user has seen it before
 */
export const RELEARNING_STEPS_MINUTES = [10]

/**
 * Graduating interval (in days)
 * First review interval when graduating from learning to review stage
 */
export const GRADUATING_INTERVAL_DAYS = 1

/**
 * Easy interval (in days)
 * Interval when user marks an item as "Easy" during learning
 */
export const EASY_INTERVAL_DAYS = 4

/**
 * Minimum interval for review stage (in days)
 * Prevents intervals from becoming too short
 */
export const MIN_REVIEW_INTERVAL_DAYS = 1

/**
 * Maximum interval (in days)
 * Prevents intervals from growing indefinitely
 */
export const MAX_INTERVAL_DAYS = 365

/**
 * Ease factor adjustments based on grade
 * These values are ADDED to current ease factor
 */
export const EASE_ADJUSTMENTS = {
  [GRADES.AGAIN]: -200, // -0.20
  [GRADES.HARD]: -150, // -0.15
  [GRADES.GOOD]: 0, // No change
  [GRADES.EASY]: 150, // +0.15
} as const

/**
 * Interval multipliers for review stage based on grade
 */
export const REVIEW_MULTIPLIERS = {
  [GRADES.AGAIN]: 0, // Reset to learning
  [GRADES.HARD]: 1.2, // 20% longer than last interval
  [GRADES.GOOD]: 'ease', // Use ease factor (special value)
  [GRADES.EASY]: 'ease', // Use ease factor with bonus
} as const

/**
 * Hard interval multiplier
 * When user marks as "Hard", multiply previous interval by this
 */
export const HARD_INTERVAL_MULTIPLIER = 1.2

/**
 * Easy bonus multiplier
 * When user marks as "Easy", multiply ease-based interval by this
 */
export const EASY_BONUS_MULTIPLIER = 1.3

/**
 * New interval after lapse (failure)
 * Multiply previous interval by this when failing a review
 */
export const LAPSE_NEW_INTERVAL_MULTIPLIER = 0

/**
 * Minimum days to add when using ease factor
 * Ensures intervals always increase by at least 1 day
 */
export const MIN_DAYS_INCREMENT = 1

/**
 * Fuzz factor range (percentage)
 * Add randomness to intervals to spread out reviews
 * Range: -5% to +5% of calculated interval
 */
export const FUZZ_FACTOR_RANGE = 0.05

/**
 * Leech threshold
 * Number of lapses before item is considered a "leech"
 * (Not implemented in MVP, but useful for future)
 */
export const LEECH_THRESHOLD = 8

/**
 * Time-based grading thresholds (seconds per character)
 *
 * Grade is calculated automatically based on response time:
 * - EASY: Fast recall (< 4 seconds per character)
 * - GOOD: Normal recall (4-8 seconds per character)
 * - HARD: Slow recall (> 8 seconds per character)
 * - AGAIN: Wrong answer or skip (handled separately)
 */
export const TIME_THRESHOLDS = {
  /** Under this = EASY grade (seconds per character) */
  EASY_MAX: 5,
  /** Under or equal to this = GOOD grade, above = HARD (seconds per character) */
  GOOD_MAX: 10,
} as const
