import { notFound, redirect } from 'next/navigation'

import { LessonContentPreview } from '@/components/features/lesson-content-preview'
import { StartLessonButton } from '@/components/features/start-lesson-button'
import { BackToLessonsButton } from '@/components/ui/back-to-lessons-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  getCharactersByIds,
  getLessonById,
  getVocabularyByIds,
  hasUserStartedLesson,
} from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'

interface LessonPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { id } = await params
  const lesson = await getLessonById(Number.parseInt(id, 10))

  if (!lesson) {
    return {
      title: 'Lesson Not Found',
    }
  }

  return {
    title: lesson.title,
    description: lesson.description ?? undefined,
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated (fail-safe for middleware edge cases)
  if (authError || !user) {
    redirect(`/login?redirectTo=/lessons/${id}`)
  }

  const lessonId = Number.parseInt(id, 10)
  const lesson = await getLessonById(lessonId)

  if (!lesson) {
    notFound()
  }

  const characters = lesson.character_ids ? await getCharactersByIds(lesson.character_ids) : []
  const vocabularyRaw = lesson.vocabulary_ids ? await getVocabularyByIds(lesson.vocabulary_ids) : []
  const vocabulary = vocabularyRaw.map((vocab) => ({
    id: vocab.id,
    word: vocab.word,
    pinyin: vocab.pinyin,
    translation: vocab.translation,
    exampleSentence: vocab.example_sentence,
  }))

  const totalItems = characters.length + vocabulary.length

  // Check if user has already started this lesson (has items in SRS queue)
  const isStarted = await hasUserStartedLesson(user.id, lessonId)

  // Note: isCompleted could be implemented later if needed
  // For now, we only care about whether the lesson was started (for practice mode)
  const isCompleted = false

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <BackToLessonsButton />

      <div className="mb-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline">Level {lesson.level}</Badge>
              <Badge variant="secondary">HSK {lesson.level}</Badge>
            </div>
            <h1 className="mb-2 text-4xl font-bold">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-lg text-muted-foreground">{lesson.description}</p>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{characters.length}</div>
                <div className="text-sm text-muted-foreground">Characters</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{vocabulary.length}</div>
                <div className="text-sm text-muted-foreground">Vocabulary</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{totalItems}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">What You&apos;ll Learn</h2>
        <LessonContentPreview characters={characters} vocabulary={vocabulary} />
      </div>

      <div className="sticky bottom-4 z-10">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <StartLessonButton
              lessonId={lessonId}
              itemCount={totalItems}
              isCompleted={isCompleted}
              isStarted={isStarted}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
