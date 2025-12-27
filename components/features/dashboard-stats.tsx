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
 * Stat card content - Professional layout with perfect number alignment
 *
 * Layout structure:
 * ┌────────────────────────────────────┐
 * │ [Icon] │ Title            │  123  │ ← row 1, number aligned right
 * │        │ Description...   │ days  │ ← row 2, suffix below number
 * └────────────────────────────────────┘
 *
 * Key features:
 * - Title never truncates (flex-1 allows wrapping)
 * - Number has fixed-width container (56px) for perfect alignment
 * - Suffix positioned below number, doesn't affect number position
 * - Description flows below title, can wrap to 2 lines
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
    <div className="flex h-full items-start gap-3.5">
      {/* Icon Container - Compact, professional */}
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            'transition-transform duration-200 ease-out',
            'group-hover:scale-110 motion-reduce:group-hover:scale-100',
            iconBackgrounds[colorScheme]
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-[22px] w-[22px]', iconColors[colorScheme])} strokeWidth={2.5} />
        </div>
      </div>

      {/* Content Grid - Perfect flow and alignment */}
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1.5">
        {/* Title - Grid position: row 1, col 1 - Never truncates */}
        <h3 className="self-start text-sm font-semibold leading-tight text-foreground">{title}</h3>

        {/* Number Container - Grid position: row 1-2, col 2 (spans both rows) */}
        <div className="row-span-2 flex flex-col items-end justify-start pt-0.5">
          {/* Fixed-width container for perfect alignment across cards */}
          <div className="flex min-w-14 flex-col items-end">
            <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
              {value}
            </span>
            {suffix && (
              <span className="mt-1 text-[10px] font-semibold leading-none text-muted-foreground/70">
                {suffix}
              </span>
            )}
          </div>
        </div>

        {/* Description - Grid position: row 2, col 1 - Can wrap to 2 lines */}
        <p className="line-clamp-2 pr-1 text-xs leading-relaxed text-muted-foreground">
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
 * - CSS Grid for perfect number alignment across cards
 * - Fixed-width number containers (56px min) ensure alignment
 * - Suffix below number, doesn't affect positioning
 * - Titles never truncate
 * - Descriptions can wrap to 2 lines
 * - Consistent card heights with auto-rows-fr
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

  // Professional card styling
  const baseCardClasses = cn(
    // Structure
    'group relative overflow-hidden rounded-2xl',
    // Height
    'h-full',
    // Borders
    'border border-border/40',
    // Background
    'bg-card',
    // Spacing
    'p-4',
    // Shadows
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
    <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
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
