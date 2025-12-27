'use client'

import { memo, useMemo } from 'react'
import { BookOpen, Brain, Calendar, Flame, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

import type { DashboardStatsProps } from './dashboard-stats.types'

/**
 * Color schemes for stat card icons (Duolingo-inspired)
 */
type ColorScheme = 'blue' | 'purple' | 'orange' | 'green' | 'cyan' | 'yellow'

const colorSchemes: Record<ColorScheme, string> = {
  blue: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900/50 text-blue-600 dark:text-blue-400',
  purple:
    'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900/50 text-purple-600 dark:text-purple-400',
  orange:
    'bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-950 dark:to-orange-900/50 text-orange-600 dark:text-orange-400',
  green:
    'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-green-900/50 text-green-600 dark:text-green-400',
  cyan: 'bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-950 dark:to-cyan-900/50 text-cyan-600 dark:text-cyan-400',
  yellow:
    'bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-950 dark:to-yellow-900/50 text-yellow-600 dark:text-yellow-400',
}

/**
 * Stat card content - Duolingo-inspired horizontal layout
 */
interface StatCardContentProps {
  title: string
  value: number
  suffix?: string
  description: string
  icon: React.ElementType
  colorScheme: ColorScheme
}

function StatCardContent({
  title,
  value,
  suffix,
  description,
  icon: Icon,
  colorScheme,
}: StatCardContentProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {/* Icon - Left side, visually prominent with colored background */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl',
            colorSchemes[colorScheme]
          )}
        >
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
        </div>
      </div>

      {/* Content - Right side */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="flex-shrink-0 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
            {value}
            {suffix && (
              <span className="ml-0.5 text-xs font-medium text-muted-foreground sm:ml-1 sm:text-sm">
                {suffix}
              </span>
            )}
          </span>
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/**
 * Dashboard Stats Component (Duolingo-inspired design)
 *
 * Displays key learning metrics with:
 * - Large colorful icons on the left
 * - Content on the right (title, number, description)
 * - Consistent horizontal layout across all breakpoints
 * - Color-coded icons for visual interest
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
        colorScheme: 'blue' as const,
      },
      {
        title: 'Reviews Due',
        value: reviewsDue,
        description: 'Ready to review now',
        icon: Brain,
        action: reviewsDue > 0 ? '/reviews' : undefined,
        colorScheme: 'purple' as const,
      },
      {
        title: 'Current Streak',
        value: currentStreak,
        suffix: currentStreak === 1 ? 'day' : 'days',
        description: `Longest: ${longestStreak} days`,
        icon: Flame,
        colorScheme: 'orange' as const,
      },
      {
        title: 'Accuracy',
        value: accuracyPercentage,
        suffix: '%',
        description: 'Overall correctness rate',
        icon: Target,
        colorScheme: 'green' as const,
      },
      {
        title: 'Today',
        value: reviewsCompletedToday,
        description: 'Reviews completed',
        icon: Calendar,
        colorScheme: 'cyan' as const,
      },
      {
        title: 'Momentum',
        value: Math.max(currentStreak, reviewsCompletedToday),
        description:
          currentStreak >= reviewsCompletedToday
            ? `${currentStreak} day${currentStreak === 1 ? '' : 's'} streak active`
            : `${reviewsCompletedToday} review${reviewsCompletedToday === 1 ? '' : 's'} today`,
        icon: TrendingUp,
        colorScheme: 'yellow' as const,
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

  const baseCardClasses =
    'rounded-xl border border-border bg-card p-3 sm:p-4 shadow-soft-md transition-all duration-base'
  const interactiveClasses =
    'cursor-pointer hover:-translate-y-0.5 hover:shadow-soft-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {statCards.map((stat, index) => {
        const ariaLabel = `${stat.title}: ${stat.value}${stat.suffix ? ` ${stat.suffix}` : ''}. ${stat.description}`

        if (stat.action) {
          return (
            <Link
              key={index}
              href={stat.action}
              className={cn(baseCardClasses, interactiveClasses)}
              aria-label={ariaLabel}
            >
              <StatCardContent
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                description={stat.description}
                icon={stat.icon}
                colorScheme={stat.colorScheme}
              />
            </Link>
          )
        }

        return (
          <div key={index} className={baseCardClasses} aria-label={ariaLabel}>
            <StatCardContent
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
              description={stat.description}
              icon={stat.icon}
              colorScheme={stat.colorScheme}
            />
          </div>
        )
      })}
    </div>
  )
})
