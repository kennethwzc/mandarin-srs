/* eslint-disable no-console */
/**
 * Common database queries for the Mandarin SRS platform
 *
 * These are pre-optimized queries used throughout the application.
 * All queries respect Row Level Security (RLS) policies.
 */

import { eq, and, lte, desc, sql, gte, inArray } from 'drizzle-orm'

import { db } from './client'
import * as schema from './schema'

// ============================================================================
// REVIEW QUEUE QUERIES
// ============================================================================

/**
 * Get review queue for a user
 * Returns all items due for review (next_review_date <= now)
 *
 * CRITICAL QUERY - Must be <50ms
 * Uses index: user_items_review_queue_idx
 *
 * @param userId - User's UUID
 * @param limit - Maximum number of items to return (default: 50)
 * @returns Array of items due for review
 */
export async function getReviewQueue(userId: string, limit: number = 50) {
  const now = new Date()

  const items = await db
    .select()
    .from(schema.userItems)
    .where(and(eq(schema.userItems.user_id, userId), lte(schema.userItems.next_review_date, now)))
    .orderBy(schema.userItems.next_review_date)
    .limit(limit)

  // TODO: Join with radicals/characters/vocabulary based on item_type
  // This will be implemented in PROMPT 4 with the full SRS logic

  return items
}

/**
 * Get upcoming reviews count (next 24 hours)
 *
 * @param userId - User's UUID
 * @returns Count of reviews due in next 24 hours
 */
export async function getUpcomingReviewsCount(userId: string) {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.userItems)
    .where(
      and(eq(schema.userItems.user_id, userId), lte(schema.userItems.next_review_date, tomorrow))
    )

  return Number(result[0]?.count ?? 0)
}

// ============================================================================
// USER PROFILE QUERIES
// ============================================================================

/**
 * Get user profile
 *
 * @param userId - User's UUID
 * @returns User profile or null
 */
export async function getUserProfile(userId: string) {
  const profiles = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1)

  return profiles[0] ?? null
}

/**
 * Create user profile (called after signup)
 *
 * @param userId - User's UUID from auth.users
 * @param email - User's email
 * @param username - Optional username
 * @returns Created profile
 */
export async function createUserProfile(userId: string, email: string, username?: string) {
  const profiles = await db
    .insert(schema.profiles)
    .values({
      id: userId,
      email,
      username,
    })
    .returning()

  return profiles[0]
}

// ============================================================================
// DASHBOARD STATS QUERIES
// ============================================================================

/**
 * Get dashboard statistics for user
 *
 * @param userId - User's UUID
 * @returns Dashboard stats
 */
export async function getDashboardStats(userId: string) {
  // Get counts by SRS stage
  const stageCounts = await db
    .select({
      stage: schema.userItems.srs_stage,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.userItems)
    .where(eq(schema.userItems.user_id, userId))
    .groupBy(schema.userItems.srs_stage)

  // Get review queue count
  const now = new Date()
  const reviewsDue = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.userItems)
    .where(and(eq(schema.userItems.user_id, userId), lte(schema.userItems.next_review_date, now)))

  // Get user profile for streak info
  const profile = await getUserProfile(userId)

  // Reviews due today (until end of day)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const reviewsDueTodayResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.userItems)
    .where(
      and(eq(schema.userItems.user_id, userId), lte(schema.userItems.next_review_date, endOfToday))
    )

  return {
    reviewsDue: Number(reviewsDue[0]?.count ?? 0),
    reviewsDueToday: Number(reviewsDueTodayResult[0]?.count ?? 0),
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    totalItemsLearned: profile?.total_items_learned ?? 0,
    stageBreakdown: stageCounts.map((s) => ({
      stage: s.stage,
      count: Number(s.count),
    })),
  }
}

/**
 * Get recent review history
 *
 * @param userId - User's UUID
 * @param limit - Number of reviews to return (default: 100)
 * @returns Recent reviews
 */
export async function getRecentReviews(userId: string, limit: number = 100) {
  return await db
    .select()
    .from(schema.reviewHistory)
    .where(eq(schema.reviewHistory.user_id, userId))
    .orderBy(desc(schema.reviewHistory.reviewed_at))
    .limit(limit)
}

/**
 * OPTIMIZED: Get daily stats range with single query
 *
 * Before: Loop through dates, multiple queries
 * After: Single query with date range
 */
export async function getDailyStatsRange(userId: string, startDate: Date, endDate: Date) {
  const stats = await db
    .select()
    .from(schema.dailyStats)
    .where(
      and(
        eq(schema.dailyStats.user_id, userId),
        gte(schema.dailyStats.stat_date, startDate),
        lte(schema.dailyStats.stat_date, endDate)
      )
    )
    .orderBy(schema.dailyStats.stat_date)

  return stats
}

/**
 * Calculate upcoming reviews forecast for the next 24 hours grouped by hour
 */
export async function getUpcomingReviewsForecast(userId: string) {
  const now = new Date()
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const upcoming = await db
    .select({ next_review_date: schema.userItems.next_review_date })
    .from(schema.userItems)
    .where(
      and(
        eq(schema.userItems.user_id, userId),
        gte(schema.userItems.next_review_date, now),
        lte(schema.userItems.next_review_date, nextDay)
      )
    )

  const hours: Array<{ hour: number; count: number }> = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }))

  for (const item of upcoming) {
    if (!item.next_review_date) {
      continue
    }
    const hour = new Date(item.next_review_date).getHours()
    const target = hours[hour] ?? { hour, count: 0 }
    hours[hour] = { hour, count: target.count + 1 }
  }

  return hours
}

// ============================================================================
// LESSON QUERIES
// ============================================================================

/**
 * Get all published lessons
 *
 * @returns All published lessons ordered by sort_order
 */
export async function getAllLessons() {
  console.log('DB QUERY: getAllLessons() started')

  try {
    const result = await db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.is_published, true))
      .orderBy(schema.lessons.sort_order)

    console.log('DB QUERY: getAllLessons() completed', {
      count: result.length,
      lessons: result.map((lesson) => ({ id: lesson.id, title: lesson.title })),
    })

    return result
  } catch (error) {
    console.error('DB QUERY ERROR: getAllLessons() failed', error)
    throw error
  }
}

/**
 * Get lesson by ID
 *
 * @param lessonId - Lesson ID
 * @returns Lesson or null
 */
export async function getLessonById(lessonId: number) {
  const lessons = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId))
    .limit(1)

  return lessons[0] ?? null
}

// ============================================================================
// CONTENT QUERIES
// ============================================================================

/**
 * Get character by ID
 *
 * @param characterId - Character ID
 * @returns Character or null
 */
export async function getCharacterById(characterId: number) {
  const characters = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, characterId))
    .limit(1)

  return characters[0] ?? null
}

/**
 * Get vocabulary by ID
 *
 * @param vocabId - Vocabulary ID
 * @returns Vocabulary or null
 */
export async function getVocabularyById(vocabId: number) {
  const vocabulary = await db
    .select()
    .from(schema.vocabulary)
    .where(eq(schema.vocabulary.id, vocabId))
    .limit(1)

  return vocabulary[0] ?? null
}

/**
 * Get all characters for HSK level
 *
 * @param hskLevel - HSK level ('1', '2', '3', etc.)
 * @returns All characters for that level
 */
export async function getCharactersByHSK(hskLevel: '1' | '2' | '3' | '4' | '5' | '6') {
  return await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.hsk_level, hskLevel))
    .orderBy(schema.characters.frequency_rank)
}

/**
 * Get all vocabulary for HSK level
 *
 * @param hskLevel - HSK level ('1', '2', '3', etc.)
 * @returns All vocabulary for that level
 */
export async function getVocabularyByHSK(hskLevel: '1' | '2' | '3' | '4' | '5' | '6') {
  return await db.select().from(schema.vocabulary).where(eq(schema.vocabulary.hsk_level, hskLevel))
}

// ============================================================================
// LESSON CONTENT HELPERS
// ============================================================================

/**
 * Get characters by IDs
 */
export async function getCharactersByIds(ids: number[]) {
  if (ids.length === 0) {
    return []
  }

  return await db.select().from(schema.characters).where(inArray(schema.characters.id, ids))
}

/**
 * Get vocabulary by IDs
 */
export async function getVocabularyByIds(ids: number[]) {
  if (ids.length === 0) {
    return []
  }

  return await db.select().from(schema.vocabulary).where(inArray(schema.vocabulary.id, ids))
}

/**
 * Check if user has started a lesson
 */
export async function hasUserStartedLesson(userId: string, lessonId: number) {
  const lesson = await getLessonById(lessonId)
  if (!lesson) {
    return false
  }

  const allItemIds = [...(lesson.character_ids || []), ...(lesson.vocabulary_ids || [])]
  if (allItemIds.length === 0) {
    return false
  }

  const userItems = await db
    .select()
    .from(schema.userItems)
    .where(and(eq(schema.userItems.user_id, userId), inArray(schema.userItems.item_id, allItemIds)))
    .limit(1)

  return userItems.length > 0
}

/**
 * Check if user has completed a lesson (all items reviewed at least once)
 */
export async function hasUserCompletedLesson(userId: string, lessonId: number) {
  const lesson = await getLessonById(lessonId)
  if (!lesson) {
    return false
  }

  const allItemIds = [...(lesson.character_ids || []), ...(lesson.vocabulary_ids || [])]
  if (allItemIds.length === 0) {
    return true
  }

  const reviewedItems = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userItems)
    .where(
      and(
        eq(schema.userItems.user_id, userId),
        inArray(schema.userItems.item_id, allItemIds),
        sql`${schema.userItems.total_reviews} > 0`
      )
    )

  const reviewedCount = reviewedItems[0]?.count ?? 0
  return reviewedCount >= allItemIds.length
}

/**
 * Get lesson progress (started/completed/unlocked) for a user
 */
export async function getUserLessonProgress(userId: string) {
  const lessons = await getAllLessons()

  const progress = await Promise.all(
    lessons.map(async (lesson) => {
      const isCompleted = await hasUserCompletedLesson(userId, lesson.id)
      const isStarted = await hasUserStartedLesson(userId, lesson.id)
      const previousLesson = lessons.find(
        (candidate) => candidate.sort_order === lesson.sort_order - 1
      )
      const previousCompleted = previousLesson
        ? await hasUserCompletedLesson(userId, previousLesson.id)
        : true

      return {
        id: lesson.id,
        title: lesson.title,
        sort_order: lesson.sort_order,
        isCompleted,
        isStarted,
        isUnlocked: lesson.sort_order === 1 || previousCompleted,
      }
    })
  )

  return progress.sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * Update user streak based on daily activity
 */
export async function updateUserStreak(userId: string) {
  const profile = await getUserProfile(userId)
  if (!profile) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStats = await db
    .select()
    .from(schema.dailyStats)
    .where(and(eq(schema.dailyStats.user_id, userId), eq(schema.dailyStats.stat_date, today)))
    .limit(1)

  const yesterdayStats = await db
    .select()
    .from(schema.dailyStats)
    .where(and(eq(schema.dailyStats.user_id, userId), eq(schema.dailyStats.stat_date, yesterday)))
    .limit(1)

  const todayStat = todayStats[0]
  const yesterdayStat = yesterdayStats[0]

  const currentStreak = profile.current_streak ?? 0
  let newStreak = currentStreak

  if (todayStat && todayStat.reviews_completed > 0) {
    if (yesterdayStat && yesterdayStat.reviews_completed > 0) {
      newStreak = currentStreak + 1
    } else if (currentStreak === 0) {
      newStreak = 1
    }
  } else if (!yesterdayStat || yesterdayStat.reviews_completed === 0) {
    newStreak = 0
  }

  const longestStreak = Math.max(profile.longest_streak ?? 0, newStreak)

  await db
    .update(schema.profiles)
    .set({
      current_streak: newStreak,
      longest_streak: longestStreak,
      updated_at: new Date(),
    })
    .where(eq(schema.profiles.id, userId))

  return { currentStreak: newStreak, longestStreak }
}

// ============================================================================
// PERFORMANCE-OPTIMIZED QUERIES
// ============================================================================

/**
 * OPTIMIZED: Get review queue with join
 *
 * Includes character/vocabulary data in single query
 */
export async function getReviewQueueOptimized(userId: string, limit: number = 50) {
  const now = new Date()

  // Single query with joins - no N+1 problem
  const items = await db.execute(sql`
    SELECT
      ui.id,
      ui.item_id,
      ui.item_type,
      ui.srs_stage,
      ui.next_review_date,
      CASE
        WHEN ui.item_type = 'character' THEN c.simplified
        WHEN ui.item_type = 'vocabulary' THEN v.word
      END as display_text,
      CASE
        WHEN ui.item_type = 'character' THEN c.pinyin
        WHEN ui.item_type = 'vocabulary' THEN v.pinyin
      END as pinyin,
      CASE
        WHEN ui.item_type = 'character' THEN c.meaning
        WHEN ui.item_type = 'vocabulary' THEN v.translation
      END as meaning
    FROM user_items ui
    LEFT JOIN characters c ON ui.item_type = 'character' AND ui.item_id = c.id
    LEFT JOIN vocabulary v ON ui.item_type = 'vocabulary' AND ui.item_id = v.id
    WHERE ui.user_id = ${userId}
      AND ui.next_review_date <= ${now}
    ORDER BY ui.next_review_date ASC
    LIMIT ${limit}
  `)

  return items[0]
}

/**
 * OPTIMIZED: Batch insert user items
 *
 * Before: Loop with individual inserts
 * After: Single bulk insert
 */
export async function batchInsertUserItems(
  userId: string,
  items: Array<{ item_id: number; item_type: 'character' | 'vocabulary' }>
) {
  if (items.length === 0) {
    return
  }

  // Build VALUES clause for bulk insert
  const values = items.map(
    (item) =>
      sql`(${userId}::uuid, ${item.item_id}, ${item.item_type}::item_type, 'new'::srs_stage, 2500, 0, NOW())`
  )

  // Use INSERT ... ON CONFLICT to handle duplicates efficiently
  await db.execute(sql`
    INSERT INTO user_items (user_id, item_id, item_type, srs_stage, ease_factor, interval_days, next_review_date)
    VALUES ${sql.join(values, sql`, `)}
    ON CONFLICT (user_id, item_id, item_type) DO NOTHING
  `)
}
