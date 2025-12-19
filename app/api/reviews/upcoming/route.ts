/**
 * Upcoming Reviews API Route
 *
 * Returns a forecast of upcoming reviews for the authenticated user.
 * Provides a 24-hour view of when reviews will become due.
 *
 * Dependencies: supabase, db/queries
 */

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getUpcomingReviewsForecast, getUpcomingReviewsCount } from '@/lib/db/queries'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/reviews/upcoming
 * Returns upcoming reviews forecast for the authenticated user
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

    // Fetch forecast and total count in parallel
    const [forecast, totalUpcoming] = await Promise.all([
      getUpcomingReviewsForecast(user.id),
      getUpcomingReviewsCount(user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        forecast,
        total: totalUpcoming,
      },
    })
  } catch (error) {
    logger.error('Error fetching upcoming reviews', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to fetch upcoming reviews' }, { status: 500 })
  }
}
