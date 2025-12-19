/**
 * Type definitions for ReviewSession component
 *
 * Dependencies: none
 */

/**
 * Review item data structure from API
 */
export interface ReviewItem {
  /** Unique review ID */
  id: string
  /** Item ID in database */
  itemId: number
  /** Type of item being reviewed */
  itemType: 'radical' | 'character' | 'vocabulary'
  /** Chinese character or word */
  character: string
  /** English meaning */
  meaning: string
  /** Correct pinyin with tone marks */
  correctPinyin: string
}

/**
 * Pending API submission data for optimistic UI
 */
export interface PendingSubmission {
  /** Item ID being submitted */
  itemId: number
  /** Type of item */
  itemType: 'radical' | 'character' | 'vocabulary'
  /** User's answer */
  userAnswer: string
  /** Expected correct answer */
  correctAnswer: string
  /** User's self-assessment grade (0-3) */
  grade: number
  /** Time taken to answer in milliseconds */
  responseTimeMs: number
  /** Whether the answer was correct */
  isCorrect: boolean
}
