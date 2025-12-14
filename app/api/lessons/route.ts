import { NextResponse } from 'next/server'

/**
 * GET /api/lessons
 * Returns all available lessons
 */
export async function GET() {
  // TODO: Implement lessons fetching from database

  return NextResponse.json({
    lessons: [],
    total: 0,
  })
}
