import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth-middleware'
import { getReviewQueue } from '@/lib/db/srs-operations'
import { withCache } from '@/lib/cache/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/reviews/queue
 *
 * Get items due for review with caching for performance.
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 *
 * Returns:
 * - Array of items due for review
 *
 * Caching:
 * - 60 second TTL with stale-while-revalidate
 * - Cache invalidated on review submission (see submit route)
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const auth = await requireAuth()
    if (auth.error) {
      return auth.error
    }
    const { user } = auth

    // 2. Parse query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    // 3. Get review queue with caching (60 second TTL)
    const cacheKey = `reviews:queue:${user.id}:${limit}`
    const queue = await withCache(
      cacheKey,
      async () => {
        return await getReviewQueue(user.id, limit)
      },
      60 // 60 second TTL - reviews don't change that frequently
    )

    // 4. Return queue
    return NextResponse.json({
      success: true,
      data: {
        queue,
        count: queue.length,
      },
    })
  } catch (error) {
    logger.error('Error fetching review queue', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        error:
          'Failed to load review items. Please refresh the page or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}
