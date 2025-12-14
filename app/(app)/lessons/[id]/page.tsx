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
    correctPinyin: 'nǐ',
  }

  const handleAnswer = (_isCorrect: boolean) => {
    // TODO: Implement answer handling
  }

  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <ReviewCard
        character={currentReview.character}
        correctPinyin={currentReview.correctPinyin}
        onAnswer={handleAnswer}
      />
    </div>
  )
}
