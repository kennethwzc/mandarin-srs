/**
 * Spaced Repetition System (SRS) Algorithm
 * Based on SM-2 algorithm with modifications for pinyin learning
 *
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

export interface SRSState {
  easeFactor: number // Starting at 2.5 (250 in integer form)
  interval: number // Days until next review
  repetitions: number // Number of successful reviews
  nextReviewDate: Date
}

export interface ReviewResult {
  newState: SRSState
  quality: number // 0-5 rating of user performance
}

/**
 * Calculate new SRS state after a review
 * @param currentState - Current SRS state
 * @param quality - Quality rating (0-5): 0=blackout, 1=incorrect, 2=incorrect (easy), 3=correct (hard), 4=correct, 5=correct (easy)
 * @returns New SRS state
 */
export function calculateNextReview(currentState: SRSState, _quality: number): SRSState {
  // TODO: Implement SM-2 algorithm
  // This will calculate:
  // - New ease factor based on quality
  // - New interval based on repetitions and ease factor
  // - Next review date

  return {
    easeFactor: currentState.easeFactor,
    interval: currentState.interval,
    repetitions: currentState.repetitions,
    nextReviewDate: new Date(),
  }
}

/**
 * Convert boolean answer to quality rating
 * @param isCorrect - Whether the answer was correct
 * @param wasEasy - Whether the user found it easy (optional)
 * @returns Quality rating (0-5)
 */
export function answerToQuality(isCorrect: boolean, wasEasy?: boolean): number {
  if (!isCorrect) {
    return 1 // Incorrect
  }
  if (wasEasy) {
    return 5 // Correct and easy
  }
  return 4 // Correct
}
