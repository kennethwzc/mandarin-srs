import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getReviewQueue } from '@/lib/db/srs-operations'

/**
 * GET /api/reviews/queue
 *
 * Get items due for review
 *
 * Query params:
 * - limit: number (default: 50, max: 100)
 *
 * Returns:
 * - Array of items due for review
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // 3. Get review queue
    const queue = await getReviewQueue(user.id, limit)

    // 4. Return queue
    return NextResponse.json({
      success: true,
      data: {
        queue,
        count: queue.length,
      },
    })
  } catch (error) {
    console.error('Error fetching review queue:', error)
    return NextResponse.json(
      {
        error:
          'Failed to load review items. Please refresh the page or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}
