import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { submitReview } from '@/lib/db/srs-operations'
import { GRADES } from '@/lib/utils/srs-constants'

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
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // 3. Determine if answer is correct
    // For pinyin, we compare normalized versions
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

    // 4. Get user's timezone (from profile or default to UTC)
    // TODO: Fetch from user profile
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

    // 6. Return updated state
    return NextResponse.json({
      success: true,
      data: {
        userItem: updatedItem,
        isCorrect,
      },
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit review. Please try again or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}
