import { NextResponse } from 'next/server'

/**
 * GET /api/user/stats
 * Returns learning statistics for the current user
 */
export async function GET() {
  // TODO: Implement stats fetching
  // This will aggregate data from reviews, lessons, etc.

  return NextResponse.json({
    charactersLearned: 0,
    reviewsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    accuracy: 0,
    reviewsDue: 0,
  })
}
