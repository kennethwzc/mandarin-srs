/**
 * Common database queries for the Mandarin SRS platform
 *
 * These are pre-optimized queries used throughout the application.
 * All queries respect Row Level Security (RLS) policies.
 */

import { eq, and, lte, desc, sql, gte } from 'drizzle-orm'

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

  return {
    reviewsDue: Number(reviewsDue[0]?.count ?? 0),
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
 * Get daily stats for date range
 *
 * @param userId - User's UUID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Daily stats for range
 */
export async function getDailyStatsRange(userId: string, startDate: Date, endDate: Date) {
  return await db
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
  return await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.is_published, true))
    .orderBy(schema.lessons.sort_order)
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
