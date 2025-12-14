'use client'

import { notFound } from 'next/navigation'

import { ReviewCard } from '@/components/features/review-card'

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  // Placeholder - will be replaced with real data fetching
  if (!params.id) {
    notFound()
  }

  // Placeholder data
  const currentReview = {
    character: '你',
    meaning: 'you',
    correctPinyin: 'nǐ',
    itemType: 'character' as const,
  }

  const handleSubmit = (result: {
    userAnswer: string
    isCorrect: boolean
    grade: number
    responseTimeMs: number
  }) => {
    // TODO: Implement answer handling with SRS
    // eslint-disable-next-line no-console
    console.log('Review result:', result)
  }

  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <ReviewCard
        character={currentReview.character}
        meaning={currentReview.meaning}
        correctPinyin={currentReview.correctPinyin}
        itemType={currentReview.itemType}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
