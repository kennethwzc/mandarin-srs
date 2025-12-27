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
 * Stat card content - Vertically centered layout
 *
 * Layout:
 * ┌─────────────────────────────────────┐
 * │                                     │ ← Equal top space
 * │ 📊  Title                      8    │ ← Everything centered
 * │     Description                     │
 * │                                     │ ← Equal bottom space
 * └─────────────────────────────────────┘
 */
interface StatCardContentProps {
  title: string
  value: number
  description: string
  icon: React.ElementType
  colorScheme: ColorScheme
  showDaysLabel?: boolean
}

function StatCardContent({
  title,
  value,
  description,
  icon: Icon,
  colorScheme,
  showDaysLabel = false,
}: StatCardContentProps) {
  return (
    // Main container - VERTICALLY CENTER EVERYTHING
    <div className="flex h-full items-center gap-3">
      {/* Icon - Vertically centered with content */}
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

      {/* Content Grid - gap-x-6 (24px) for more right spacing */}
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-6 gap-y-0.5">
        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-foreground">{title}</h3>

        {/* Number Container */}
        <div className="row-span-2 flex items-start justify-end">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-foreground">
              {value}
            </span>
            {showDaysLabel && (
              <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/50">
                days
              </span>
            )}
          </div>
        </div>

        {/* Description */}
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
 * - Vertically centered content in fixed-height cards
 * - 24px right spacing for numbers (gap-x-6)
 * - Optional "days" label for streak card
 * - Clean, aligned number display
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

  // Memoize stat cards
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
        description: `Longest: ${longestStreak} days`,
        icon: Flame,
        colorScheme: 'orange' as const,
        showDaysLabel: true,
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

  // Professional card styling with fixed height for vertical centering
  const baseCardClasses = cn(
    'group relative overflow-hidden rounded-2xl',
    // Fixed height for consistent vertical centering
    'h-[110px]',
    'border border-border/40',
    'bg-card',
    'p-4',
    'shadow-sm',
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
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
                showDaysLabel={stat.showDaysLabel}
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
              showDaysLabel={stat.showDaysLabel}
            />
          </div>
        )
      })}
    </div>
  )
})
