import { LessonCard } from '@/components/features/lesson-card'

export default function LessonsPage() {
  // Placeholder data - will be replaced with real data
  const lessons = [
    {
      id: '1',
      title: 'Basic Characters',
      description: 'Learn the most common Chinese characters',
      characterCount: 50,
      completed: false,
    },
    {
      id: '2',
      title: 'Numbers',
      description: 'Master Chinese numbers 1-100',
      characterCount: 20,
      completed: true,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
        <p className="text-muted-foreground">Choose a lesson to start learning</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} {...lesson} />
        ))}
      </div>
    </div>
  )
}
