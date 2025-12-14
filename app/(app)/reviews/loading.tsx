export default function ReviewsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Progress skeleton */}
        <div className="space-y-2">
          <div className="h-4 animate-pulse rounded bg-muted" />
          <div className="h-2 animate-pulse rounded bg-muted" />
        </div>

        {/* Card skeleton */}
        <div className="space-y-6 rounded-lg border p-8">
          <div className="h-32 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
