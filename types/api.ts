/**
 * API response types
 *
 * Standardized response shapes for all API endpoints.
 * Ensures consistent error handling and data access patterns.
 *
 * Dependencies: none
 */

/**
 * Generic API response wrapper
 * @template T - Type of data payload
 */
export interface ApiResponse<T> {
  /** Response data (present on success) */
  data?: T
  /** Error message (present on failure) */
  error?: string
  /** Whether the request was successful */
  success: boolean
}

/**
 * Response from GET /api/reviews/queue
 */
export interface ReviewQueueResponse {
  /** Array of review items ready for practice */
  reviews: Array<{
    /** Unique review identifier */
    id: string
    /** Chinese character to review */
    character: string
    /** Expected pinyin answer */
    correctPinyin: string
    /** When this review became due (ISO 8601) */
    nextReviewDate: string
  }>
  /** Total number of reviews in queue */
  total: number
}

/**
 * Response from POST /api/reviews/submit
 */
export interface ReviewSubmissionResponse {
  /** Whether submission was processed successfully */
  success: boolean
  /** When the next review is scheduled (ISO 8601) */
  nextReviewDate: string
  /** New interval in days until next review */
  newInterval: number
}

/**
 * Response from GET /api/user/stats
 */
export interface UserStatsResponse {
  /** Total unique characters learned */
  charactersLearned: number
  /** Total reviews completed all-time */
  reviewsCompleted: number
  /** Current consecutive days of activity */
  currentStreak: number
  /** Longest streak ever achieved */
  longestStreak: number
  /** Overall accuracy percentage (0-100) */
  accuracy: number
  /** Number of reviews currently due */
  reviewsDue: number
}
