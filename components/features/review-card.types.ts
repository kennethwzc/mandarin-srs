/**
 * Type definitions for ReviewCard component
 *
 * Dependencies: none
 */

/**
 * Props for ReviewCard component
 */
export interface ReviewCardProps {
  /** Character to review (你, 好, etc.) */
  character: string
  /** English meaning */
  meaning: string
  /** Correct answer (nǐ, hǎo, etc.) */
  correctPinyin: string
  /** Type of item being reviewed */
  itemType: 'radical' | 'character' | 'vocabulary'
  /** Called when review is graded */
  onSubmit: (result: ReviewResult) => void
  /** Optional skip functionality */
  onSkip?: () => void
}

/**
 * Result from completing a review
 */
export interface ReviewResult {
  /** What user typed */
  userAnswer: string
  /** Whether answer was correct */
  isCorrect: boolean
  /** Self-assessment grade (0-3: Again, Hard, Good, Easy) */
  grade: number
  /** Time taken to answer in milliseconds */
  responseTimeMs: number
}
