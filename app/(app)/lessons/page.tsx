/* eslint-disable no-console */

import dynamic from 'next/dynamic'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getAllLessons } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'
import { AlertCircle, Info } from 'lucide-react'

// Dynamically import LessonCard to avoid SSR issues with Link component
const LessonCard = dynamic(
  () => import('@/components/features/lesson-card').then((m) => ({ default: m.LessonCard })),
  { ssr: false }
)

export const metadata = {
  title: 'Lessons',
  description: 'Learn new Chinese characters and vocabulary',
}

export default async function LessonsPage() {
  console.log('=== LESSONS PAGE: Starting render ===')

  try {
    console.log('STEP 1: Checking authentication...')
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('AUTH ERROR:', authError)
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError.message}</AlertDescription>
          </Alert>
        </div>
      )
    }

    if (!user) {
      console.error('NO USER: User not authenticated')
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Authenticated</AlertTitle>
            <AlertDescription>Please log in to view lessons.</AlertDescription>
          </Alert>
        </div>
      )
    }

    console.log('✓ User authenticated:', user.id)

    console.log('STEP 2: Fetching lessons from database...')
    const lessons = await getAllLessons()

    console.log('Lessons fetched:', {
      count: lessons.length,
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        character_ids_count: lesson.character_ids?.length || 0,
        vocabulary_ids_count: lesson.vocabulary_ids?.length || 0,
      })),
    })

    if (!lessons || lessons.length === 0) {
      console.warn('NO LESSONS: Database returned empty array')
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Lessons</h1>
            <p className="text-lg text-muted-foreground">
              Learn new characters and vocabulary through structured lessons
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Lessons Available</AlertTitle>
            <AlertDescription>
              No lessons found in the database. This usually means:
              <ul className="ml-5 mt-2 list-disc">
                <li>Seed data hasn&apos;t been loaded yet</li>
                <li>
                  Run: <code className="rounded bg-muted px-1">pnpm db:seed</code>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="mt-4 rounded bg-muted p-4">
            <h3 className="mb-2 font-semibold">Debugging Info:</h3>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(
                {
                  user_id: user.id,
                  lessons_count: 0,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )
    }

    console.log('STEP 3: Processing lessons with progress...')
    const lessonsWithProgress = lessons.map((lesson, index) => {
      const processed = {
        ...lesson,
        characterCount: lesson.character_ids?.length || 0,
        vocabularyCount: lesson.vocabulary_ids?.length || 0,
        isUnlocked: index === 0,
        isCompleted: false,
      }
      console.log(`  Lesson ${lesson.id}:`, {
        title: lesson.title,
        characterCount: processed.characterCount,
        vocabularyCount: processed.vocabularyCount,
        isUnlocked: processed.isUnlocked,
      })
      return processed
    })

    console.log('✓ Processed lessons:', lessonsWithProgress.length)
    console.log('=== LESSONS PAGE: Rendering UI ===')

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Lessons</h1>
          <p className="text-lg text-muted-foreground">
            Learn new characters and vocabulary through structured lessons
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Debug Info</AlertTitle>
            <AlertDescription>
              <div className="space-y-1 text-xs">
                <div>User ID: {user.id}</div>
                <div>Lessons loaded: {lessonsWithProgress.length}</div>
                <div>First lesson: {lessonsWithProgress[0]?.title || 'N/A'}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertTitle>How Lessons Work</AlertTitle>
          <AlertDescription>
            Each lesson introduces new characters and vocabulary. Review the content, then click
            &quot;Start Learning&quot; to add items to your review queue. Complete lessons in order
            to unlock the next one.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessonsWithProgress.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </div>
    )
  } catch (error) {
    console.error('=== LESSONS PAGE ERROR ===')
    console.error('Error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')

    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Lessons</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>An error occurred while loading lessons.</p>
              <details className="rounded bg-destructive/10 p-2 text-xs">
                <summary className="cursor-pointer font-semibold">Error Details</summary>
                <pre className="mt-2 overflow-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
