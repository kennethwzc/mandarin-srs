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
 * Stat card content - Professional horizontal layout
 * Visual hierarchy: Number (primary) > Title (secondary) > Description (tertiary)
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
      {/* Icon Container - Fixed size, professional styling */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl',
            'h-12 w-12 sm:h-14 sm:w-14',
            'transition-transform duration-200 ease-out',
            'group-hover:scale-110 motion-reduce:group-hover:scale-100',
            iconBackgrounds[colorScheme]
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-6 w-6 sm:h-7 sm:w-7', iconColors[colorScheme])} strokeWidth={2} />
        </div>
      </div>

      {/* Content Container - Professional hierarchy */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:gap-4">
        {/* Left: Title and Description */}
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-[13px] font-semibold leading-none text-foreground sm:text-sm">
            {title}
          </h3>
          <p className="truncate text-[11px] leading-none text-muted-foreground sm:text-xs">
            {description}
          </p>
        </div>

        {/* Right: Number - Primary focus */}
        <div className="flex-shrink-0">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl">
              {value}
            </span>
            {suffix && (
              <span className="text-xs font-medium leading-none text-muted-foreground sm:text-sm">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Dashboard Stats Component (Professional design)
 *
 * Features:
 * - Clear visual hierarchy (Number > Title > Description)
 * - Generous padding and consistent spacing
 * - Subtle shadows and refined borders
 * - Smooth micro-interactions
 * - Color-coded icons for visual interest
 * - Responsive typography scaling
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

  // Professional card styling with subtle elevation
  const baseCardClasses = cn(
    // Structure
    'group relative overflow-hidden rounded-2xl',
    // Borders - Professional treatment (subtle)
    'border border-border/50',
    // Background
    'bg-card',
    // Spacing - Generous, professional
    'p-4 sm:p-5',
    // Shadows - Subtle elevation
    'shadow-sm',
    // Transitions - Smooth, professional
    'transition-all duration-200 ease-out motion-reduce:transition-none'
  )

  // Interactive card enhancements
  const interactiveClasses = cn(
    // Interactivity
    'cursor-pointer',
    // Hover state - Subtle lift
    'hover:shadow-md hover:-translate-y-0.5 hover:border-border motion-reduce:hover:transform-none',
    // Focus state - Accessibility
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    // Active state - Press feedback
    'active:translate-y-0 active:shadow-sm'
  )

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4 xl:gap-5">
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
