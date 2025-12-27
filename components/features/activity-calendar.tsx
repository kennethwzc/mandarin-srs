'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

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
 * Fully responsive:
 * - Mobile (< 640px): Last 3 months, larger cells
 * - Tablet (640px - 1024px): Last 6 months, medium cells
 * - Desktop (≥ 1024px): Full year, standard cells
 */
export function ActivityCalendar({ data }: ActivityCalendarProps) {
  // Responsive data filtering - show fewer days on mobile
  const [displayDays, setDisplayDays] = useState(365)

  useEffect(() => {
    const updateDisplayDays = () => {
      if (typeof window === 'undefined') {
        return
      }

      if (window.innerWidth < 640) {
        setDisplayDays(90) // 3 months for mobile
      } else if (window.innerWidth < 1024) {
        setDisplayDays(180) // 6 months for tablet
      } else {
        setDisplayDays(365) // Full year for desktop
      }
    }

    updateDisplayDays()
    window.addEventListener('resize', updateDisplayDays)
    return () => window.removeEventListener('resize', updateDisplayDays)
  }, [])

  const today = new Date()

  // Generate days array based on display count
  const days = useMemo(() => {
    const result: Array<{ date: Date; count: number }> = []

    for (let i = displayDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const dateString = date.toISOString().split('T')[0]
      const dayData = data.find((d) => d.date === dateString)

      result.push({
        date,
        count: dayData?.count ?? 0,
      })
    }

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayDays, data])

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: Date; count: number }>> = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [days])

  const getIntensity = useCallback((count: number): number => {
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
  }, [])

  const getColorClass = useCallback((intensity: number): string => {
    const colors: string[] = [
      'bg-muted',
      'bg-green-200 dark:bg-green-900/30',
      'bg-green-400 dark:bg-green-800/50',
      'bg-green-600 dark:bg-green-700/70',
      'bg-green-800 dark:bg-green-600',
    ]
    const clamped = Math.max(0, Math.min(colors.length - 1, intensity))
    return colors[clamped] ?? 'bg-muted'
  }, [])

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

  // Get visible month labels based on displayed days
  const visibleMonths = useMemo(() => {
    const monthsShown = new Map<string, string>()

    days.forEach((day) => {
      const monthKey = `${day.date.getFullYear()}-${day.date.getMonth()}`
      if (!monthsShown.has(monthKey)) {
        monthsShown.set(monthKey, months[day.date.getMonth()] ?? '')
      }
    })

    const monthLabels = Array.from(monthsShown.values())

    // On mobile, show only first, middle, and last month
    if (displayDays <= 90 && monthLabels.length > 3) {
      return [
        monthLabels[0],
        monthLabels[Math.floor(monthLabels.length / 2)],
        monthLabels[monthLabels.length - 1],
      ].filter(Boolean) as string[]
    }

    // On tablet, show every other month if too many
    if (displayDays <= 180 && monthLabels.length > 6) {
      return monthLabels.filter((_, idx) => idx % 2 === 0)
    }

    return monthLabels
  }, [days, displayDays, months])

  // Dynamic description based on display range
  const dateRangeText = useMemo(() => {
    if (displayDays >= 365) {
      return 'over the past year'
    }
    if (displayDays >= 180) {
      return 'over the past 6 months'
    }
    return 'over the past 3 months'
  }, [displayDays])

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Activity Calendar</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Your daily review activity {dateRangeText}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="w-full">
          {/* Month labels - responsive */}
          <div className="mb-1.5 flex justify-between px-0.5 text-[10px] text-muted-foreground sm:mb-2 sm:text-xs">
            {visibleMonths.map((month, idx) => (
              <div
                key={`${month}-${idx}`}
                className="flex-1 text-center first:text-left last:text-right"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Calendar grid - responsive cells and gaps */}
          <div className="flex gap-0.5 sm:gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-1 flex-col gap-0.5 sm:gap-[2px]">
                {week.map((day, dayIndex) => {
                  const intensity = getIntensity(day.count)
                  const colorClass = getColorClass(intensity)

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        // Responsive cell sizes - aspect-square for consistent sizing
                        'aspect-square w-full rounded-[2px] transition-colors',
                        'sm:rounded-sm',
                        colorClass,
                        'cursor-pointer',
                        'hover:ring-1 hover:ring-primary hover:ring-offset-1 sm:hover:ring-2',
                        'active:scale-90'
                      )}
                      title={`${day.date.toLocaleDateString()}: ${day.count} reviews`}
                      role="gridcell"
                      aria-label={`${day.date.toLocaleDateString()}: ${day.count} reviews`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend - responsive */}
          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground sm:mt-4 sm:gap-1.5 sm:text-xs">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div
                key={intensity}
                className={cn(
                  'h-2 w-2 rounded-[2px]',
                  'sm:h-2.5 sm:w-2.5 sm:rounded-sm',
                  'md:h-[10px] md:w-[10px]',
                  getColorClass(intensity)
                )}
                aria-label={`Intensity level ${intensity}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
