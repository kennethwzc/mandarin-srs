import { Skeleton } from '@/components/ui/skeleton'

export default function LessonDetailLoading() {
  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <Skeleton className="h-[500px] w-full max-w-2xl" />
    </div>
  )
}
