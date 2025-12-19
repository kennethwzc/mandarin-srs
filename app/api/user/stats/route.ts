/**
 * User Stats API Route
 *
 * Returns aggregated learning statistics for the authenticated user.
 * This is a lightweight endpoint for quick stats access.
 * For full dashboard data, use /api/dashboard/stats instead.
 *
 * Dependencies: supabase, db/queries
 */

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getAllTimeAccuracy } from '@/lib/db/queries'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/user/stats
 * Returns learning statistics for the current user
 */
export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch stats in parallel
    const [stats, accuracy] = await Promise.all([
      getDashboardStats(user.id),
      getAllTimeAccuracy(user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        charactersLearned: stats.totalItemsLearned,
        reviewsCompleted: stats.reviewsDue, // This is items with reviews
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        accuracy,
        reviewsDue: stats.reviewsDue,
      },
    })
  } catch (error) {
    logger.error('Error fetching user stats', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
