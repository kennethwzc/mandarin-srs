/**
 * Review queue hook
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { useQuery } from '@tanstack/react-query'
import { useReviewStore } from '@/lib/stores/review-store'

export function useReviewQueue() {
  const { queue } = useReviewStore()

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['review-queue'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/queue')
      if (!response.ok) {
        throw new Error('Failed to fetch review queue')
      }
      return response.json()
    },
  })

  return {
    queue: data?.reviews || queue,
    isLoading: queryLoading,
    total: data?.total || 0,
  }
}
