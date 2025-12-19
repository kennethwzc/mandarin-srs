'use client'

import { useMemo } from 'react'
import Link from 'next/link'

import { Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UpcomingReviewsProps {
  /**
   * Array of ISO timestamp strings for upcoming reviews.
   * These will be grouped by hour using the user's local timezone.
   */
  forecast: string[]
}

/**
 * Upcoming Reviews Component
 *
 * Shows when reviews are due in the next 24 hours.
 * Uses client-side local time to display hours correctly for the user's timezone.
 */
export function UpcomingReviews({ forecast }: UpcomingReviewsProps) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Reviews
        </CardTitle>
        <CardDescription>{totalUpcoming} reviews due in the next 6 hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {upcomingHours.map((item, index) => {
            const percentage = (item.count / maxCount) * 100

            return (
              <div key={`${item.hour}-${index}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.hour}:00
                    {index === 0 && ' (now)'}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {totalUpcoming > 0 && (
          <Button asChild className="w-full">
            <Link href="/reviews">Start Reviewing</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
