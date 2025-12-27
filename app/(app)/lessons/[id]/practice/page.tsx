import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'

import { PracticeSession } from '@/components/features/practice-session'
import { getLessonById } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'

interface PracticePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PracticePageProps) {
  const { id } = await params
  const lesson = await getLessonById(Number.parseInt(id, 10))

  if (!lesson) {
    return {
      title: 'Practice - Lesson Not Found',
    }
  }

  return {
    title: `Practice: ${lesson.title}`,
    description: `Practice the items from ${lesson.title}`,
  }
}

/**
 * Lesson Practice Page
 *
 * Practice mode for a specific lesson:
 * - Shows ALL items from the lesson (not just due items)
 * - Does NOT update SRS state
 * - Does NOT affect stats (accuracy, streak, etc.)
 * - Can be repeated unlimited times
 */
export default async function LessonPracticePage({ params }: PracticePageProps) {
  const { id } = await params

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (authError || !user) {
    redirect(`/login?redirectTo=/lessons/${id}/practice`)
  }

  const lessonId = Number.parseInt(id, 10)

  if (Number.isNaN(lessonId)) {
    notFound()
  }

  const lesson = await getLessonById(lessonId)

  if (!lesson) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Practice: {lesson.title}</h1>
        <p className="text-muted-foreground">
          Type the correct pinyin with tone marks • No SRS impact
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        }
      >
        <PracticeSession lessonId={lessonId} lessonTitle={lesson.title} />
      </Suspense>
    </div>
  )
}
