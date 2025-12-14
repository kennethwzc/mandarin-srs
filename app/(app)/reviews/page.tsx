import { ReviewCard } from '@/components/features/review-card'

export default function ReviewsPage() {
  // Placeholder data - will be replaced with real data
  const currentReview = {
    character: '好',
    correctPinyin: 'hǎo',
  }

  const handleAnswer = (_isCorrect: boolean) => {
    // TODO: Implement answer handling with SRS algorithm
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">Practice characters you&apos;ve learned</p>
      </div>

      <div className="flex min-h-[600px] items-center justify-center">
        <ReviewCard
          character={currentReview.character}
          correctPinyin={currentReview.correctPinyin}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  )
}
