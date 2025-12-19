/**
 * Type definitions for PracticeSession component
 *
 * Dependencies: none
 */

/**
 * Practice item data structure
 */
export interface PracticeItem {
  /** Unique item identifier */
  itemId: number
  /** Type of item being practiced */
  itemType: 'character' | 'vocabulary'
  /** Chinese character or word */
  character: string
  /** English meaning */
  meaning: string
  /** Correct pinyin with tone marks */
  correctPinyin: string
}

/**
 * Props for PracticeSession component
 */
export interface PracticeSessionProps {
  /** Lesson ID to practice */
  lessonId: number
  /** Lesson title for display */
  lessonTitle: string
}
