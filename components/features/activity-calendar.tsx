'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface ActivityCalendarProps {
  data: Array<{
    date: string
    count: number
  }>
}

/**
 * Activity Calendar Component
 *
 * GitHub-style heatmap showing daily review activity.
 */
export function ActivityCalendar({ data }: ActivityCalendarProps) {
  const today = new Date()
  const days: Array<{ date: Date; count: number }> = []

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const dateString = date.toISOString().split('T')[0]
    const dayData = data.find((d) => d.date === dateString)

    days.push({
      date,
      count: dayData?.count ?? 0,
    })
  }

  const weeks: Array<Array<{ date: Date; count: number }>> = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const getIntensity = (count: number): number => {
    if (count === 0) {
      return 0
    }
    if (count < 5) {
      return 1
    }
    if (count < 10) {
      return 2
    }
    if (count < 20) {
      return 3
    }
    return 4
  }

  const getColorClass = (intensity: number): string => {
    const colors: string[] = [
      'bg-muted',
      'bg-green-200 dark:bg-green-900/30',
      'bg-green-400 dark:bg-green-800/50',
      'bg-green-600 dark:bg-green-700/70',
      'bg-green-800 dark:bg-green-600',
    ]
    const clamped = Math.max(0, Math.min(colors.length - 1, intensity))
    return colors[clamped] ?? 'bg-muted'
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Calendar</CardTitle>
        <CardDescription>Your daily review activity over the past year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="mb-2 flex gap-[2px] text-xs text-muted-foreground">
              {months.map((month) => (
                <div key={month} className="w-[52px] text-center">
                  {month}
                </div>
              ))}
            </div>

            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => {
                    const intensity = getIntensity(day.count)
                    const colorClass = getColorClass(intensity)

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={cn(
                          'h-[10px] w-[10px] rounded-sm transition-colors',
                          colorClass,
                          'cursor-pointer hover:ring-2 hover:ring-primary'
                        )}
                        title={`${day.date.toLocaleDateString()}: ${day.count} reviews`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((intensity) => (
                <div
                  key={intensity}
                  className={cn('h-[10px] w-[10px] rounded-sm', getColorClass(intensity))}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
