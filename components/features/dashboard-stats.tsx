'use client'

import { memo, useMemo } from 'react'
import { BookOpen, Brain, Calendar, Flame, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

import type { DashboardStatsProps } from './dashboard-stats.types'

/**
 * Stat card content - shared between link and div versions
 */
interface StatCardContentProps {
  title: string
  value: number
  suffix?: string
  description: string
  icon: React.ElementType
}

function StatCardContent({ title, value, suffix, description, icon: Icon }: StatCardContentProps) {
  return (
    <>
      {/* Mobile: horizontal layout with number on right */}
      <div className="flex items-center justify-between gap-4 sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-sm font-medium text-muted-foreground">{title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <p className="text-3xl font-bold tabular-nums leading-none text-foreground">
            {value}
            {suffix && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>
            )}
          </p>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      {/* Desktop: vertical layout with number below title (original design) */}
      <div className="hidden sm:block">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="mb-1 text-3xl font-bold tabular-nums text-foreground">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </>
  )
}

/**
 * Dashboard Stats Component (Apple-inspired minimalist design)
 *
 * Displays key learning metrics in clean, minimal card format.
 * Uses typography and spacing for hierarchy, not colors.
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
      },
      {
        title: 'Reviews Due',
        value: reviewsDue,
        description: 'Ready to review now',
        icon: Brain,
        action: reviewsDue > 0 ? '/reviews' : undefined,
      },
      {
        title: 'Current Streak',
        value: currentStreak,
        suffix: currentStreak === 1 ? 'day' : 'days',
        description: `Longest: ${longestStreak} days`,
        icon: Flame,
      },
      {
        title: 'Accuracy',
        value: accuracyPercentage,
        suffix: '%',
        description: 'Overall correctness rate',
        icon: Target,
      },
      {
        title: 'Today',
        value: reviewsCompletedToday,
        description: 'Reviews completed',
        icon: Calendar,
      },
      {
        title: 'Momentum',
        value: Math.max(currentStreak, reviewsCompletedToday),
        description:
          currentStreak >= reviewsCompletedToday
            ? `${currentStreak} day${currentStreak === 1 ? '' : 's'} streak active`
            : `${reviewsCompletedToday} review${reviewsCompletedToday === 1 ? '' : 's'} today`,
        icon: TrendingUp,
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
    'rounded-xl border border-border bg-card p-4 sm:p-6 shadow-soft-md transition-all duration-base'
  const interactiveClasses =
    'cursor-pointer hover:-translate-y-0.5 hover:shadow-soft-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3">
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
            />
          </div>
        )
      })}
    </div>
  )
})
