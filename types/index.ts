/**
 * Shared TypeScript types
 */

export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  title: string
  description?: string
  order: number
  characterCount?: number
  completed?: boolean
}

export interface Character {
  id: string
  character: string
  pinyin: string
  meaning?: string
  lessonId?: string
}

export interface Review {
  id: string
  character: string
  correctPinyin: string
  characterId: string
  nextReviewDate: string
}

export interface ReviewSubmission {
  reviewId: string
  isCorrect: boolean
  userAnswer: string
}

export interface UserStats {
  charactersLearned: number
  reviewsCompleted: number
  currentStreak: number
  longestStreak: number
  accuracy: number
  reviewsDue: number
}
