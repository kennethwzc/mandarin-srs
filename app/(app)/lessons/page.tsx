/**
 * Lessons Page
 *
 * Displays all available lessons for learning Chinese characters and vocabulary.
 * Includes timeout protection to prevent "Connection closed" errors in production.
 * Uses Suspense for progressive loading and better abort handling.
 */

import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'
import { redirect } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshButton } from '@/components/ui/refresh-button'
import { getAllLessons, getUserLessonProgress } from '@/lib/db/queries'
import { getAuthenticatedUser } from '@/lib/supabase/get-user'
import { isAbortedError, safeAsync } from '@/lib/utils/request-helpers'
import { AlertCircle, Info } from 'lucide-react'

// Dynamically import LessonCard to avoid SSR issues with Link component
const LessonCard = dynamicImport(
  () => import('@/components/features/lesson-card').then((m) => ({ default: m.LessonCard })),
  { ssr: false }
)

export const metadata = {
  title: 'Lessons',
  description: 'Learn new Chinese characters and vocabulary',
}

export const dynamic = 'force-dynamic'

// Timeout for database queries (5 seconds)
const QUERY_TIMEOUT_MS = 5000

/**
 * Helper to execute a promise with timeout protection
 * Prevents "Connection closed" errors from hanging indefinitely
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    return result
  } catch (error) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    throw error
  }
}

/**
 * Lessons content component - wrapped in Suspense for progressive loading
 */
async function LessonsContent() {
  // Step 1: Check authentication using simplified pattern
  // Middleware has already validated - this is a safety net
  const user = await getAuthenticatedUser()

  // If user is null, redirect to login (middleware should have caught this)
  if (!user) {
    redirect('/login?redirectTo=/lessons')
  }

  // Step 2: Fetch lessons with timeout protection and abort handling
  const lessons = await safeAsync(
    () =>
      withTimeout(
        getAllLessons(),
        QUERY_TIMEOUT_MS,
        'Lessons query timeout - database may be slow'
      ),
    [],
    undefined
  )

  // Step 3: Handle no lessons
  if (!lessons || lessons.length === 0) {
    return (
      <div className="mb-6 sm:mb-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Lessons Available</AlertTitle>
          <AlertDescription>
            No lessons found in the database. This usually means the seed data hasn&apos;t been
            loaded yet.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Step 4: Fetch user progress with timeout protection
  const progress = await safeAsync(
    () =>
      withTimeout(
        getUserLessonProgress(user.id),
        QUERY_TIMEOUT_MS,
        'Progress query timeout - database may be slow'
      ),
    [],
    undefined
  )

  // Create a map of progress data keyed by lesson ID for efficient lookup
  const progressMap = new Map(progress.map((p) => [p.id, p]))

  // Step 5: Merge lesson data with user progress
  const lessonsWithProgress = lessons.map((lesson) => {
    const userProgress = progressMap.get(lesson.id)
    return {
      id: lesson.id,
      level: lesson.level,
      title: lesson.title,
      description: lesson.description,
      characterCount: lesson.character_ids?.length || 0,
      vocabularyCount: lesson.vocabulary_ids?.length || 0,
      isUnlocked: userProgress?.isUnlocked ?? lesson.sort_order === 1,
      isCompleted: userProgress?.isCompleted ?? false,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lessonsWithProgress.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  )
}

/**
 * Lessons page with Suspense boundary for progressive loading
 */
export default async function LessonsPage() {
  try {
    // Check authentication - if fails, redirect (handled by middleware)
    const user = await getAuthenticatedUser()
    if (!user) {
      redirect('/login?redirectTo=/lessons')
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Lessons</h1>
          <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
            Learn new characters and vocabulary through structured lessons
          </p>
        </div>

        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertTitle>How Lessons Work</AlertTitle>
          <AlertDescription>
            Each lesson introduces new characters and vocabulary. Review the content, then click
            &quot;Start Learning&quot; to add items to your review queue. Complete lessons in order
            to unlock the next one.
          </AlertDescription>
        </Alert>

        <Suspense fallback={<LessonsSkeleton />}>
          <LessonsContent />
        </Suspense>
      </div>
    )
  } catch (error) {
    // If request was aborted during navigation, show minimal UI instead of error
    if (isAbortedError(error)) {
      return <LessonsMinimalFallback message="Loading was interrupted. Please refresh." />
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Lessons</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>An error occurred while loading lessons. Please try again.</p>
              <div className="pt-2">
                <RefreshButton variant="outline" size="sm">
                  Try Again
                </RefreshButton>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}

/**
 * Skeleton loading state for lessons list
 */
function LessonsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-lg border bg-muted"
          aria-label="Loading lesson"
        />
      ))}
    </div>
  )
}

/**
 * Minimal fallback for lessons page when loading is interrupted
 */
function LessonsMinimalFallback({ message }: { message: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Lessons</h1>
        <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
          Learn new characters and vocabulary through structured lessons
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Loading Interrupted</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{message}</p>
            <div className="pt-2">
              <RefreshButton variant="outline" size="sm">
                Refresh
              </RefreshButton>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
