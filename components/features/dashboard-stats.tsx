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
 * Stat card content - Professional horizontal layout with CSS Grid alignment
 *
 * Uses CSS Grid for perfect number alignment across all cards:
 * - Number column spans 2 rows for consistent vertical positioning
 * - Description can wrap to 2 lines without affecting alignment
 * - Tabular numbers ensure digit alignment
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
    <div className="flex h-full items-start gap-3 sm:gap-4">
      {/* Icon Container - Fixed size, consistent across all cards */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl',
            'transition-transform duration-200 ease-out',
            'group-hover:scale-105 motion-reduce:group-hover:scale-100',
            iconBackgrounds[colorScheme]
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-6 w-6 sm:h-7 sm:w-7', iconColors[colorScheme])} strokeWidth={2} />
        </div>
      </div>

      {/* Content Grid - Perfect alignment structure */}
      <div className="grid min-w-0 flex-1 auto-rows-min grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1">
        {/* Title - Grid row 1, column 1 */}
        <h3 className="truncate text-sm font-semibold leading-tight text-foreground">{title}</h3>

        {/* Number - Grid row 1-2, column 2 - ALIGNED ACROSS ALL CARDS */}
        <div className="row-span-2 flex items-baseline justify-end gap-0.5 pt-0.5">
          <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl">
            {value}
          </span>
          {suffix && (
            <span className="whitespace-nowrap text-xs font-medium leading-none text-muted-foreground sm:text-sm">
              {suffix}
            </span>
          )}
        </div>

        {/* Description - Grid row 2, column 1 - Can wrap to 2 lines */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/**
 * Dashboard Stats Component (Professional design)
 *
 * Features:
 * - CSS Grid for perfect number alignment across cards
 * - Consistent card heights with auto-rows-fr
 * - 2-line description wrapping with line-clamp-2
 * - Optimized breakpoints (480px for 2-column)
 * - Smooth micro-interactions
 * - Color-coded icons for visual interest
 * - Accessibility compliant (WCAG AA)
 * - Dark mode optimized
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

  // Professional card styling with consistent height
  const baseCardClasses = cn(
    // Structure
    'group relative overflow-hidden rounded-2xl',
    // Height consistency
    'h-full min-h-[100px]',
    // Borders - Subtle
    'border border-border/40',
    // Background
    'bg-card',
    // Spacing
    'p-4 sm:p-5',
    // Elevation
    'shadow-sm',
    // Transitions
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
    <div className="grid auto-rows-fr grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-4 lg:grid-cols-3 lg:gap-4 xl:gap-5">
      {statCards.map((stat, index) => {
        const ariaLabel = [
          stat.title,
          `${stat.value}${stat.suffix ? ` ${stat.suffix}` : ''}`,
          stat.description,
          stat.action ? 'Click to navigate' : '',
        ]
          .filter(Boolean)
          .join('. ')

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
