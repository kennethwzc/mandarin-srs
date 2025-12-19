/**
 * Shared TypeScript types
 *
 * Core domain types used throughout the application.
 * These represent the main entities in the Mandarin SRS system.
 *
 * Dependencies: none
 */

/**
 * User account information
 */
export interface User {
  /** Unique user identifier (UUID) */
  id: string
  /** User's email address */
  email: string
  /** Display name (optional) */
  name?: string
  /** Account creation timestamp (ISO 8601) */
  createdAt: string
  /** Last profile update timestamp (ISO 8601) */
  updatedAt: string
}

/**
 * Lesson containing characters and vocabulary to learn
 */
export interface Lesson {
  /** Unique lesson identifier */
  id: string
  /** Display title of the lesson */
  title: string
  /** Brief description of lesson content (optional) */
  description?: string
  /** Sort order for lesson progression (1-based) */
  order: number
  /** Number of characters in this lesson (optional) */
  characterCount?: number
  /** Whether user has completed this lesson (optional) */
  completed?: boolean
}

/**
 * Chinese character with learning metadata
 */
export interface Character {
  /** Unique character identifier */
  id: string
  /** The Chinese character (simplified) */
  character: string
  /** Pinyin pronunciation with tone marks */
  pinyin: string
  /** English meaning/translation (optional) */
  meaning?: string
  /** ID of lesson this character belongs to (optional) */
  lessonId?: string
}

/**
 * Review item ready for user practice
 */
export interface Review {
  /** Unique review record identifier */
  id: string
  /** Chinese character to review */
  character: string
  /** Expected pinyin answer with tone marks */
  correctPinyin: string
  /** Reference to the character being reviewed */
  characterId: string
  /** When this review is due (ISO 8601) */
  nextReviewDate: string
}

/**
 * User's answer submission for a review
 */
export interface ReviewSubmission {
  /** ID of the review being answered */
  reviewId: string
  /** Whether the user's answer was correct */
  isCorrect: boolean
  /** The pinyin answer the user provided */
  userAnswer: string
}

/**
 * Aggregated statistics for a user's learning progress
 */
export interface UserStats {
  /** Total unique characters the user has learned */
  charactersLearned: number
  /** Total number of reviews completed all-time */
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
