/**
 * API response types
 */

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface ReviewQueueResponse {
  reviews: Array<{
    id: string
    character: string
    correctPinyin: string
    nextReviewDate: string
  }>
  total: number
}

export interface ReviewSubmissionResponse {
  success: boolean
  nextReviewDate: string
  newInterval: number
}

export interface UserStatsResponse {
  charactersLearned: number
  reviewsCompleted: number
  currentStreak: number
  longestStreak: number
  accuracy: number
  reviewsDue: number
}
