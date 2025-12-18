/**
 * GET /api/dashboard/quick-stats
 *
 * Fast endpoint for initial dashboard render.
 * Returns only essential stats in <500ms.
 *
 * Used for progressive loading - shows basic stats immediately
 * while heavier data (charts, calendar) loads in background.
 */

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getAllTimeAccuracy } from '@/lib/db/queries'
import { getCached, setCached } from '@/lib/cache/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get from cache first (1 min TTL for quick stats)
    const cacheKey = `dashboard:quick-stats:${user.id}`
    const cached = await getCached<{
      totalItemsLearned: number
      reviewsDueToday: number
      currentStreak: number
      longestStreak: number
      accuracyPercentage: number
    }>(cacheKey)

    if (cached) {
      return NextResponse.json({ success: true, data: cached })
    }

    // Fetch quick stats in parallel
    const [overallStats, accuracyPercentage] = await Promise.all([
      getDashboardStats(user.id),
      getAllTimeAccuracy(user.id),
    ])

    const quickStats = {
      totalItemsLearned: overallStats.totalItemsLearned,
      reviewsDueToday: overallStats.reviewsDueToday ?? overallStats.reviewsDue,
      currentStreak: overallStats.currentStreak,
      longestStreak: overallStats.longestStreak,
      accuracyPercentage,
    }

    // Cache for 1 minute
    await setCached(cacheKey, quickStats, 60)

    return NextResponse.json({
      success: true,
      data: quickStats,
    })
  } catch (error) {
    // Return minimal error response
    return NextResponse.json(
      { error: 'Failed to load quick stats' },
      { status: 500 }
    )
  }
}

