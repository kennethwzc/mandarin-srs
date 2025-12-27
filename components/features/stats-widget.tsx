'use client'

import { memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export interface StatsWidgetProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

/**
 * Stats widget component (Apple-inspired minimalist design)
 *
 * Displays a single stat with optional trend indicator.
 * Uses clean typography and subtle visual hierarchy.
 */
export const StatsWidget = memo(function StatsWidget({
  title,
  value,
  description,
  trend,
}: StatsWidgetProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-soft-md">
      {/* Title */}
      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>

      {/* Value */}
      <p className="mb-1 text-3xl font-bold text-foreground">{value}</p>

      {/* Description */}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {/* Trend indicator */}
      {trend && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs font-medium',
            trend.isPositive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {trend.isPositive ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          )}
          <span>
            {trend.isPositive ? '+' : ''}
            {trend.value} from last period
          </span>
        </div>
      )}
    </div>
  )
})
