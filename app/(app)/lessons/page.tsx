import { LessonCard } from '@/components/features/lesson-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/server'
import { getAllLessons } from '@/lib/db/queries'
import { BookOpen, Info } from 'lucide-react'

export const metadata = {
  title: 'Lessons',
  description: 'Learn new Chinese characters and vocabulary',
}

export default async function LessonsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const lessons = await getAllLessons()

  const lessonsWithProgress = lessons.map((lesson, index) => ({
    id: lesson.id,
    level: lesson.level,
    title: lesson.title,
    description: lesson.description,
    characterCount: lesson.character_ids?.length ?? 0,
    vocabularyCount: lesson.vocabulary_ids?.length ?? 0,
    isUnlocked: index === 0,
    isCompleted: false,
    completionDate: null,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Lessons</h1>
        <p className="text-lg text-muted-foreground">
          Learn new characters and vocabulary through structured lessons
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>How Lessons Work</AlertTitle>
        <AlertDescription>
          Each lesson introduces new characters and vocabulary. Review the content, then click
          &quot;Start Learning&quot; to add items to your review queue. Complete lessons in order to
          unlock the next one.
        </AlertDescription>
      </Alert>

      {lessonsWithProgress.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">No Lessons Available</h2>
          <p className="text-muted-foreground">
            Lessons will be available after content is loaded.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessonsWithProgress.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  )
}
