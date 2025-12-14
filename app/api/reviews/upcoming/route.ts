import { NextResponse } from 'next/server'

/**
 * GET /api/reviews/upcoming
 * Returns upcoming reviews for the authenticated user
 */
export async function GET() {
  // TODO: Implement upcoming reviews fetching
  // This will query reviews scheduled for the next 7 days

  return NextResponse.json({
    upcoming: [],
    total: 0,
  })
}
