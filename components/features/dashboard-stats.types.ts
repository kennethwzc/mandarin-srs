/**
 * Type definitions for DashboardStats component
 *
 * Dependencies: none
 */

/**
 * User statistics for display on dashboard
 */
export interface DashboardStatsData {
  /** Total number of items the user has learned */
  totalItemsLearned: number
  /** Number of reviews due now (not by end of day) */
  reviewsDue: number
  /** Current consecutive days of activity */
  currentStreak: number
  /** Longest streak ever achieved */
  longestStreak: number
  /** Overall accuracy percentage (0-100) */
  accuracyPercentage: number
  /** Number of reviews completed today */
  reviewsCompletedToday: number
}

/**
 * Props for DashboardStats component
 */
export interface DashboardStatsProps {
  /** Statistics data to display */
  stats: DashboardStatsData
}
