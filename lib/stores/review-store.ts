/**
 * Zustand store for review queue state
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { create } from 'zustand'

interface ReviewState {
  currentReview: {
    character: string
    correctPinyin: string
    id: string
  } | null
  queue: Array<{ id: string; character: string; correctPinyin: string }>
  isLoading: boolean
  setCurrentReview: (review: ReviewState['currentReview']) => void
  setQueue: (queue: ReviewState['queue']) => void
  setLoading: (loading: boolean) => void
}

export const useReviewStore = create<ReviewState>((set) => ({
  currentReview: null,
  queue: [],
  isLoading: false,
  setCurrentReview: (review) => set({ currentReview: review }),
  setQueue: (queue) => set({ queue }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
