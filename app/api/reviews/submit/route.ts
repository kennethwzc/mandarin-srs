import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth-middleware'
import { submitReview } from '@/lib/db/srs-operations'
import { comparePinyinExact } from '@/lib/utils/pinyin-utils'
import { calculateGradeFromTime } from '@/lib/utils/srs-algorithm'
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

    // Note: grade is received from client but we recalculate server-side for security
    const {
      itemId,
      itemType,
      userAnswer,
      correctAnswer,
      grade: _clientGrade,
      responseTimeMs,
    } = validationResult.data

    // 3. Determine if answer is correct using centralized pinyin comparison
    const isCorrect = comparePinyinExact(userAnswer, correctAnswer)

    // 4. Recalculate grade server-side for security
    // This ensures clients cannot manipulate their grades
    const calculatedGrade = calculateGradeFromTime(
      responseTimeMs,
      correctAnswer.length, // Character count from the correct answer
      isCorrect
    )

    // 5. Get user's timezone (from profile or default to UTC)
    // TODO (Q1 2025): Fetch timezone from user profile once timezone field is added to profiles table
    const timezone = 'UTC'

    // 6. Submit review with server-calculated grade
    const updatedItem = await submitReview({
      userId: user.id,
      itemId,
      itemType,
      userAnswer,
      correctAnswer,
      isCorrect,
      grade: calculatedGrade,
      responseTimeMs,
      timezone,
    })

    // 7. Invalidate review queue cache for this user
    // This ensures fresh data on next page load after completing reviews
    await Promise.all([
      deleteCached(`reviews:queue:${user.id}:10`),
      deleteCached(`reviews:queue:${user.id}:20`),
      deleteCached(`reviews:queue:${user.id}:50`),
      deleteCached(`reviews:queue:${user.id}:100`),
      deleteCached(`dashboard:stats:${user.id}`), // Also invalidate dashboard stats
    ])

    // 8. Return updated state
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
