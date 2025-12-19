import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth-middleware'
import { submitReview } from '@/lib/db/srs-operations'
import { comparePinyinExact } from '@/lib/utils/pinyin-utils'
import { GRADES } from '@/lib/utils/srs-constants'
import { deleteCached } from '@/lib/cache/server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/reviews/submit
 *
 * Submit a review and get updated SRS state
 *
 * Body:
 * - itemId: number
 * - itemType: 'radical' | 'character' | 'vocabulary'
 * - userAnswer: string (pinyin input)
 * - correctAnswer: string (expected pinyin)
 * - grade: 0-3 (Again, Hard, Good, Easy)
 * - responseTimeMs: number
 *
 * Returns:
 * - Updated user_item with new SRS state
 */

const reviewSubmissionSchema = z.object({
  itemId: z.number(),
  itemType: z.enum(['radical', 'character', 'vocabulary']),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  grade: z.number().min(GRADES.AGAIN).max(GRADES.EASY),
  responseTimeMs: z.number().min(0),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const auth = await requireAuth()
    if (auth.error) {
      return auth.error
    }
    const { user } = auth

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = reviewSubmissionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { itemId, itemType, userAnswer, correctAnswer, grade, responseTimeMs } =
      validationResult.data

    // 3. Determine if answer is correct using centralized pinyin comparison
    const isCorrect = comparePinyinExact(userAnswer, correctAnswer)

    // 4. Get user's timezone (from profile or default to UTC)
    // TODO (Q1 2025): Fetch timezone from user profile once timezone field is added to profiles table
    const timezone = 'UTC'

    // 5. Submit review
    const updatedItem = await submitReview({
      userId: user.id,
      itemId,
      itemType,
      userAnswer,
      correctAnswer,
      isCorrect,
      grade: grade as 0 | 1 | 2 | 3,
      responseTimeMs,
      timezone,
    })

    // 6. Invalidate review queue cache for this user
    // This ensures fresh data on next page load after completing reviews
    await Promise.all([
      deleteCached(`reviews:queue:${user.id}:10`),
      deleteCached(`reviews:queue:${user.id}:20`),
      deleteCached(`reviews:queue:${user.id}:50`),
      deleteCached(`reviews:queue:${user.id}:100`),
      deleteCached(`dashboard:stats:${user.id}`), // Also invalidate dashboard stats
    ])

    // 7. Return updated state
    return NextResponse.json({
      success: true,
      data: {
        userItem: updatedItem,
        isCorrect,
      },
    })
  } catch (error) {
    logger.error('Error submitting review', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        error:
          'Failed to submit review. Please try again or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}
