/**
 * Simplified dashboard stats without caching
 * For debugging purposes
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Just get basic stats without all the complex queries
    const stats = await getDashboardStats(user.id)

    return NextResponse.json({
      success: true,
      stats: {
        totalItemsLearned: stats.totalItemsLearned,
        reviewsDue: stats.reviewsDue,
        reviewsDueToday: stats.reviewsDueToday,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      },
    })
  } catch (error) {
    console.error('Simple stats error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
