import { eq, and, lte } from 'drizzle-orm'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

import { db } from './client'
import * as schema from './schema'
import { calculateNextReview } from '@/lib/utils/srs-algorithm'
import type { SrsInput } from '@/lib/utils/srs-algorithm'
import type { Grade } from '@/lib/utils/srs-constants'

type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

/**
 * Database operations for SRS reviews
 *
 * These functions handle:
 * - Submitting review results
 * - Updating user_items with new SRS state
 * - Recording review history
 * - Updating daily stats
 */

/**
 * Review submission input
 */
export interface ReviewSubmission {
  userId: string
  itemId: number
  itemType: 'radical' | 'character' | 'vocabulary'
  userAnswer: string // User's pinyin input
  correctAnswer: string // Expected pinyin
  isCorrect: boolean // Whether answer was correct
  grade: Grade // User's self-assessment (0-3)
  responseTimeMs: number // Time taken to answer
  timezone: string // User's timezone
}

/**
 * Submit a review and update SRS state
 *
 * This function:
 * 1. Gets current SRS state from user_items
 * 2. Calculates next review using SRS algorithm
 * 3. Updates user_items with new state
 * 4. Records review in review_history
 * 5. Updates daily_stats
 *
 * @param submission - Review submission data
 * @returns Updated user item
 */
export async function submitReview(submission: ReviewSubmission) {
  const {
    userId,
    itemId,
    itemType,
    userAnswer,
    correctAnswer,
    isCorrect,
    grade,
    responseTimeMs,
    timezone,
  } = submission

  // Start transaction
  return await db.transaction(async (tx) => {
    // 1. Get current user_item state
    const userItems = await tx
      .select()
      .from(schema.userItems)
      .where(
        and(
          eq(schema.userItems.user_id, userId),
          eq(schema.userItems.item_id, itemId),
          eq(schema.userItems.item_type, itemType)
        )
      )
      .limit(1)

    let userItem = userItems[0]

    // If user_item doesn't exist, create it
    if (!userItem) {
      const newItems = await tx
        .insert(schema.userItems)
        .values({
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
          srs_stage: 'new',
          ease_factor: 2500,
          interval_days: 0,
          current_step: 0,
          next_review_date: new Date(),
        })
        .returning()

      userItem = newItems[0]!
    }

    // 2. Calculate next review state using SRS algorithm
    const srsInput: SrsInput = {
      currentStage: userItem.srs_stage as 'new' | 'learning' | 'review' | 'relearning',
      currentInterval: userItem.interval_days,
      currentEaseFactor: userItem.ease_factor,
      currentStep: userItem.current_step ?? 0, // Use stored step from database
      grade,
      timezone,
    }

    const srsResult = calculateNextReview(srsInput)

    // 3. Update user_item with new SRS state
    const updatedItems = await tx
      .update(schema.userItems)
      .set({
        srs_stage: srsResult.newStage,
        ease_factor: srsResult.newEaseFactor,
        interval_days: srsResult.newInterval,
        current_step: srsResult.newStep, // Save the new step to track learning/relearning progress
        next_review_date: srsResult.nextReviewDate,
        last_reviewed_at: new Date(),
        total_reviews: userItem.total_reviews + 1,
        correct_count: userItem.correct_count + (isCorrect ? 1 : 0),
        incorrect_count: userItem.incorrect_count + (isCorrect ? 0 : 1),
        updated_at: new Date(),
      })
      .where(eq(schema.userItems.id, userItem.id))
      .returning()

    // 4. Record review in history
    await tx.insert(schema.reviewHistory).values({
      user_id: userId,
      item_id: itemId,
      item_type: itemType,
      question_type: 'meaning_to_pinyin',
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      grade,
      response_time_ms: responseTimeMs,
      new_srs_stage: srsResult.newStage,
      new_interval: srsResult.newInterval,
    })

    // 5. Update daily stats
    await updateDailyStats(tx, userId, isCorrect, responseTimeMs)

    return updatedItems[0]!
  })
}

/**
 * Update daily statistics
 * Creates or updates daily_stats record for today
 */
async function updateDailyStats(
  tx: DbTransaction,
  userId: string,
  isCorrect: boolean,
  responseTimeMs: number
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if stats exist for today
  const existingStats = await tx
    .select()
    .from(schema.dailyStats)
    .where(and(eq(schema.dailyStats.user_id, userId), eq(schema.dailyStats.stat_date, today)))
    .limit(1)

  if (existingStats.length > 0) {
    // Update existing stats
    const stats = existingStats[0]!
    const newReviewsCompleted = stats.reviews_completed + 1
    const newCorrectCount =
      stats.reviews_completed * (stats.accuracy_percentage / 100) + (isCorrect ? 1 : 0)
    const newAccuracy = Math.round((newCorrectCount / newReviewsCompleted) * 100)

    await tx
      .update(schema.dailyStats)
      .set({
        reviews_completed: newReviewsCompleted,
        accuracy_percentage: newAccuracy,
        time_spent_seconds: stats.time_spent_seconds + Math.floor(responseTimeMs / 1000),
        updated_at: new Date(),
      })
      .where(eq(schema.dailyStats.id, stats.id))
  } else {
    // Create new stats
    await tx.insert(schema.dailyStats).values({
      user_id: userId,
      stat_date: today,
      reviews_completed: 1,
      new_items_learned: 0, // TODO: Track new items
      accuracy_percentage: isCorrect ? 100 : 0,
      time_spent_seconds: Math.floor(responseTimeMs / 1000),
      streak_maintained: true,
    })
  }
}

/**
 * Get review queue for user
 * Returns items due for review
 */
export async function getReviewQueue(userId: string, limit: number = 50) {
  const now = new Date()

  const items = await db
    .select()
    .from(schema.userItems)
    .where(and(eq(schema.userItems.user_id, userId), lte(schema.userItems.next_review_date, now)))
    .orderBy(schema.userItems.next_review_date)
    .limit(limit)

  // TODO: Join with radicals/characters/vocabulary to get full content
  // This will be added when we build the review interface

  return items
}
