/**
 * Simplified dashboard stats without caching
 * For debugging purposes
 */

import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth-middleware'
import { getDashboardStats } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth.error) {
      return auth.error
    }
    const { user } = auth

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
