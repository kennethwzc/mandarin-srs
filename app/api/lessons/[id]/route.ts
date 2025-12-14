import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /api/lessons/[id]
 * Returns a specific lesson with its characters
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Implement lesson fetching from database
  const lessonId = params.id

  if (!lessonId) {
    return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
  }

  return NextResponse.json({
    id: lessonId,
    title: '',
    description: '',
    characters: [],
  })
}
