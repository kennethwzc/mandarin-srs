'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface UpcomingReviewsProps {
  /**
   * Array of ISO timestamp strings for upcoming reviews.
   * These will be grouped by hour using the user's local timezone.
   */
  forecast: string[]
}

/**
 * Upcoming Reviews Component (Apple-inspired minimalist design)
 *
 * Shows when reviews are due in the next 24 hours.
 * Uses client-side local time to display hours correctly for the user's timezone.
 */
export const UpcomingReviews = memo(function UpcomingReviews({ forecast }: UpcomingReviewsProps) {
  // Calculate current hour in user's local timezone
  const currentHour = useMemo(() => new Date().getHours(), [])

  // Group forecast timestamps by hour using user's local timezone
  const forecastByHour = useMemo(() => {
    const hours: Array<{ hour: number; count: number }> = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }))

    for (const timestamp of forecast) {
      const date = new Date(timestamp)
      const hour = date.getHours()
      const target = hours[hour] ?? { hour, count: 0 }
      hours[hour] = { hour, count: target.count + 1 }
    }

    return hours
  }, [forecast])

  // Get next 6 hours starting from current hour
  const upcomingHours: Array<{ hour: number; count: number }> = []
  for (let i = 0; i < 6; i++) {
    const hour = (currentHour + i) % 24
    const data = forecastByHour.find((entry) => entry.hour === hour) ?? { hour, count: 0 }
    upcomingHours.push(data)
  }

  const totalUpcoming = upcomingHours.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(...upcomingHours.map((item) => item.count), 1)

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft-md">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="mb-1 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground">Upcoming Reviews</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalUpcoming} review{totalUpcoming !== 1 ? 's' : ''} due in the next 6 hours
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4 p-6">
        {/* Hour breakdown */}
        <div className="space-y-3">
          {upcomingHours.map((item, index) => {
            const percentage = (item.count / maxCount) * 100

            return (
              <div key={`${item.hour}-${index}`} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.hour.toString().padStart(2, '0')}:00
                    {index === 0 && (
                      <span className="ml-1 text-xs text-muted-foreground/70">(now)</span>
                    )}
                  </span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={item.count}
                  aria-valuemin={0}
                  aria-valuemax={maxCount}
                  aria-label={`${item.count} reviews at ${item.hour}:00`}
                >
                  <div
                    className="h-full bg-primary transition-all duration-slow"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Action button */}
        {totalUpcoming > 0 && (
          <Button
            asChild
            className="w-full transition-all duration-base hover:opacity-90 active:scale-95"
          >
            <Link href="/reviews">Start Reviewing</Link>
          </Button>
        )}

        {/* Empty state */}
        {totalUpcoming === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No reviews scheduled for the next 6 hours.
          </p>
        )}
      </div>
    </div>
  )
})
