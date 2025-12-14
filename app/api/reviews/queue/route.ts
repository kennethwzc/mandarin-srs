import { NextResponse } from 'next/server'

/**
 * GET /api/reviews/queue
 * Returns the current review queue for the authenticated user
 */
export async function GET() {
  // TODO: Implement review queue fetching from database
  // This will use Supabase auth to get the current user
  // and query the database for reviews due

  return NextResponse.json({
    reviews: [],
    total: 0,
  })
}
