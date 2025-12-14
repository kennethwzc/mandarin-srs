import { ProgressChart } from '@/components/features/progress-chart'
import { StreakDisplay } from '@/components/features/streak-display'

export default function ProgressPage() {
  // Placeholder data
  const progressData = [
    { date: '2024-01-01', value: 10 },
    { date: '2024-01-02', value: 15 },
    { date: '2024-01-03', value: 20 },
    { date: '2024-01-04', value: 25 },
    { date: '2024-01-05', value: 30 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StreakDisplay currentStreak={5} longestStreak={10} />
        <ProgressChart data={progressData} title="Characters Learned" />
      </div>
    </div>
  )
}
