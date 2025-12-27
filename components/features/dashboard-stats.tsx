'use client'

import { memo, useMemo } from 'react'
import { BookOpen, Brain, Calendar, Flame, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

import type { DashboardStatsProps } from './dashboard-stats.types'

/**
 * Color schemes for stat card icons (Professional design)
 */
type ColorScheme = 'blue' | 'purple' | 'orange' | 'green' | 'cyan' | 'yellow'

const iconBackgrounds: Record<ColorScheme, string> = {
  blue: 'bg-blue-50 dark:bg-blue-500/10',
  purple: 'bg-purple-50 dark:bg-purple-500/10',
  orange: 'bg-orange-50 dark:bg-orange-500/10',
  green: 'bg-green-50 dark:bg-green-500/10',
  cyan: 'bg-cyan-50 dark:bg-cyan-500/10',
  yellow: 'bg-yellow-50 dark:bg-yellow-500/10',
}

const iconColors: Record<ColorScheme, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-600 dark:text-orange-400',
  green: 'text-green-600 dark:text-green-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
}

/**
 * Stat card content - Clean layout with perfect number alignment
 *
 * Layout structure:
 * ┌────────────────────────────────────┐
 * │ [Icon] │ Title               │ 123 │
 * │        │ Description...      │     │
 * └────────────────────────────────────┘
 *
 * Key features:
 * - NO suffixes on numbers (clean alignment)
 * - Context info goes in description
 * - Numbers always align at exact same position
 * - Tabular nums for consistent digit width
 */
interface StatCardContentProps {
  title: string
  value: number
  description: string
  icon: React.ElementType
  colorScheme: ColorScheme
}

function StatCardContent({
  title,
  value,
  description,
  icon: Icon,
  colorScheme,
}: StatCardContentProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            'transition-transform duration-200',
            'group-hover:scale-110 motion-reduce:group-hover:scale-100',
            iconBackgrounds[colorScheme]
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-[22px] w-[22px]', iconColors[colorScheme])} strokeWidth={2.5} />
        </div>
      </div>

      {/* Content - Simple two-column grid */}
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
        {/* Title - Row 1, Col 1 */}
        <h3 className="text-sm font-semibold leading-snug text-foreground">{title}</h3>

        {/* Number - Row 1, Col 2 - ALWAYS at same position */}
        <div className="row-span-2 flex items-start justify-end pt-px">
          <span className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-foreground">
            {value}
          </span>
        </div>

        {/* Description - Row 2, Col 1 */}
        <p className="line-clamp-2 pt-0.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

/**
 * Dashboard Stats Component (Professional design)
 *
 * Features:
 * - NO suffixes on numbers (clean, perfect alignment)
 * - Context info in descriptions (e.g., "7 days • Longest: 7 days")
 * - CSS Grid for consistent alignment
 * - Tabular nums for uniform digit width
 * - Clean, uncluttered appearance
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

  // Memoize stat cards - NO suffixes, context in descriptions
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
        description: `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'} • Longest: ${longestStreak}`,
        icon: Flame,
        colorScheme: 'orange' as const,
      },
      {
        title: 'Accuracy',
        value: accuracyPercentage,
        description: 'Overall correctness rate',
        icon: Target,
        colorScheme: 'green' as const,
      },
      {
        title: 'Today',
        value: reviewsCompletedToday,
        description: 'Reviews completed today',
        icon: Calendar,
        colorScheme: 'cyan' as const,
      },
      {
        title: 'Momentum',
        value: Math.max(currentStreak, reviewsCompletedToday),
        description:
          currentStreak >= reviewsCompletedToday
            ? `${currentStreak} day streak active`
            : `${reviewsCompletedToday} reviews today`,
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

  // Professional card styling
  const baseCardClasses = cn(
    // Structure
    'group relative overflow-hidden rounded-2xl',
    // Consistent height
    'min-h-[100px]',
    // Border
    'border border-border/40',
    // Background
    'bg-card',
    // Padding
    'p-4',
    // Shadow
    'shadow-sm',
    // Transition
    'transition-all duration-200 ease-out motion-reduce:transition-none'
  )

  // Interactive card enhancements
  const interactiveClasses = cn(
    'cursor-pointer',
    'hover:shadow-md hover:-translate-y-0.5 hover:border-border/60 motion-reduce:hover:transform-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'active:translate-y-0 active:shadow-sm'
  )

  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
      {statCards.map((stat, index) => {
        const ariaLabel = `${stat.title}: ${stat.value}. ${stat.description}`

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
