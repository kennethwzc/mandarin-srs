'use client'

import { memo, useMemo, useCallback } from 'react'
import { BookOpen, Brain, Calendar, Flame, Target, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

import type { DashboardStatsProps } from './dashboard-stats.types'

/**
 * Get text color class based on accuracy percentage
 * @param percentage - Accuracy percentage (0-100)
 * @returns Tailwind color class
 */
function getAccuracyTextColor(percentage: number): string {
  if (percentage >= 80) {
    return 'text-green-600 dark:text-green-400'
  }
  if (percentage >= 60) {
    return 'text-yellow-600 dark:text-yellow-400'
  }
  return 'text-red-600 dark:text-red-400'
}

/**
 * Get background color class based on accuracy percentage
 * @param percentage - Accuracy percentage (0-100)
 * @returns Tailwind background color class
 */
function getAccuracyBgColor(percentage: number): string {
  if (percentage >= 80) {
    return 'bg-green-100 dark:bg-green-900/20'
  }
  if (percentage >= 60) {
    return 'bg-yellow-100 dark:bg-yellow-900/20'
  }
  return 'bg-red-100 dark:bg-red-900/20'
}

/**
 * Dashboard Stats Component (Optimized with React.memo)
 *
 * Displays key learning metrics in card format.
 * Only re-renders when stats actually change.
 */
export const DashboardStats = memo(function DashboardStats({ stats }: DashboardStatsProps) {
  const {
    totalItemsLearned,
    reviewsDue,
    currentStreak,
    longestStreak,
    accuracyPercentage,
    reviewsCompletedToday,
  } = stats

  // Memoize stat cards to prevent re-creation on every render
  const statCards = useMemo(
    () => [
      {
        title: 'Items Learned',
        value: totalItemsLearned,
        description: 'Total characters & vocabulary',
        icon: BookOpen,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      },
      {
        title: 'Reviews Due',
        value: reviewsDue,
        description: 'Ready to review now',
        icon: Brain,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        action: reviewsDue > 0 ? '/reviews' : undefined,
      },
      {
        title: 'Current Streak',
        value: currentStreak,
        suffix: currentStreak === 1 ? 'day' : 'days',
        description: `Longest: ${longestStreak} days`,
        icon: Flame,
        color: currentStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400',
        bgColor: currentStreak > 0 ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-gray-100 dark:bg-gray-800',
      },
      {
        title: 'Accuracy',
        value: accuracyPercentage,
        suffix: '%',
        description: 'Overall correctness rate',
        icon: Target,
        color: getAccuracyTextColor(accuracyPercentage),
        bgColor: getAccuracyBgColor(accuracyPercentage),
      },
      {
        title: 'Today Reviews',
        value: reviewsCompletedToday,
        description: 'Completed today',
        icon: Calendar,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-100 dark:bg-sky-900/20',
      },
      {
        title: 'Momentum',
        value: Math.max(currentStreak, reviewsCompletedToday),
        description: 'Keep the streak alive',
        icon: TrendingUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      },
    ],
    [
      totalItemsLearned,
      reviewsDue,
      currentStreak,
      longestStreak,
      accuracyPercentage,
      reviewsCompletedToday,
    ]
  )

  // Memoize click handler
  const handleCardClick = useCallback((action?: string) => {
    if (action) {
      window.location.href = action
    }
  }, [])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className={cn(
            'transition-all duration-200',
            stat.action && 'cursor-pointer hover:shadow-lg'
          )}
          onClick={() => handleCardClick(stat.action)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={cn('rounded-lg p-2', stat.bgColor)}>
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value}
              {stat.suffix && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {stat.suffix}
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {stat.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})
