import { eq, and, lte } from 'drizzle-orm'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

import { db } from './client'
import * as schema from './schema'
import { updateUserStreak } from './queries'
import { calculateNextReview } from '@/lib/utils/srs-algorithm'
import { deleteCached } from '@/lib/cache/server'
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
  const result = await db.transaction(async (tx) => {
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

      const newItem = newItems[0]
      if (!newItem) {
        throw new Error('Failed to create user item')
      }
      userItem = newItem
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

    const updatedItem = updatedItems[0]
    if (!updatedItem) {
      throw new Error('Failed to update user item')
    }
    return updatedItem
  })

  // 6. Update user streak (outside transaction since it uses its own db connection)
  await updateUserStreak(userId)

  // 7. Invalidate dashboard cache so stats refresh immediately
  await deleteCached(`dashboard:stats:${userId}`)

  return result
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

  const existingStat = existingStats[0]
  if (existingStat) {
    // Update existing stats
    const newReviewsCompleted = existingStat.reviews_completed + 1
    const newCorrectCount =
      existingStat.reviews_completed * (existingStat.accuracy_percentage / 100) + (isCorrect ? 1 : 0)
    const newAccuracy = Math.round((newCorrectCount / newReviewsCompleted) * 100)

    await tx
      .update(schema.dailyStats)
      .set({
        reviews_completed: newReviewsCompleted,
        accuracy_percentage: newAccuracy,
        time_spent_seconds: existingStat.time_spent_seconds + Math.floor(responseTimeMs / 1000),
        updated_at: new Date(),
      })
      .where(eq(schema.dailyStats.id, existingStat.id))
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
 * Get review queue for user with actual content data
 * Returns items due for review with joined character/vocabulary data
 */
export async function getReviewQueue(userId: string, limit: number = 50) {
  const now = new Date()

  const items = await db
    .select({
      id: schema.userItems.id,
      item_id: schema.userItems.item_id,
      item_type: schema.userItems.item_type,
      current_step: schema.userItems.current_step,
      // Character data
      character_simplified: schema.characters.simplified,
      character_pinyin: schema.characters.pinyin,
      character_meaning: schema.characters.meaning,
      // Vocabulary data
      vocabulary_word: schema.vocabulary.word,
      vocabulary_pinyin: schema.vocabulary.pinyin,
      vocabulary_translation: schema.vocabulary.translation,
    })
    .from(schema.userItems)
    .leftJoin(
      schema.characters,
      and(
        eq(schema.userItems.item_id, schema.characters.id),
        eq(schema.userItems.item_type, 'character')
      )
    )
    .leftJoin(
      schema.vocabulary,
      and(
        eq(schema.userItems.item_id, schema.vocabulary.id),
        eq(schema.userItems.item_type, 'vocabulary')
      )
    )
    .where(and(eq(schema.userItems.user_id, userId), lte(schema.userItems.next_review_date, now)))
    .orderBy(schema.userItems.next_review_date)
    .limit(limit)

  // Transform to consistent format
  return items.map((item) => ({
    id: item.id,
    item_id: item.item_id,
    item_type: item.item_type,
    current_step: item.current_step,
    character:
      item.item_type === 'character' ? item.character_simplified || '' : item.vocabulary_word || '',
    pinyin:
      item.item_type === 'character' ? item.character_pinyin || '' : item.vocabulary_pinyin || '',
    meaning:
      item.item_type === 'character'
        ? item.character_meaning || ''
        : item.vocabulary_translation || '',
  }))
}
