/**
 * Database Schema for Mandarin SRS Platform (Pinyin Input)
 *
 * Content Hierarchy:
 * - Radicals: Building blocks (214 radicals)
 * - Characters: Chinese characters (~600 for HSK 1-3)
 * - Vocabulary: Words made of characters (~1200 for HSK 1-3)
 * - Lessons: Organized learning units
 *
 * User Progress:
 * - user_items: SRS state for each item per user
 * - review_history: Detailed review logs
 * - daily_stats: Pre-aggregated daily statistics
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  serial,
} from 'drizzle-orm/pg-core'

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Type of learning item
 */
export const itemTypeEnum = pgEnum('item_type', ['radical', 'character', 'vocabulary'])

/**
 * SRS stages based on SM-2 algorithm
 * - new: Never reviewed
 * - learning: Initial learning phase (short intervals)
 * - review: Regular review phase (long intervals)
 * - relearning: Failed review, back to learning
 */
export const srsStageEnum = pgEnum('srs_stage', ['new', 'learning', 'review', 'relearning'])

/**
 * Type of review question
 * For pinyin input app, we only have one type: meaning → pinyin
 */
export const questionTypeEnum = pgEnum('question_type', ['meaning_to_pinyin'])

/**
 * HSK levels (1-6)
 * Currently supporting HSK 1-3 for MVP
 */
export const hskLevelEnum = pgEnum('hsk_level', ['1', '2', '3', '4', '5', '6'])

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * User profiles (extends Supabase auth.users)
 *
 * RLS Policy: Users can only view/edit their own profile
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    username: text('username').unique(),
    email: text('email').notNull().unique(),
    timezone: text('timezone').default('UTC'),

    // Learning preferences
    daily_new_items_limit: integer('daily_new_items_limit').default(10),
    daily_review_limit: integer('daily_review_limit').default(100),

    // Progress tracking
    current_streak: integer('current_streak').default(0),
    longest_streak: integer('longest_streak').default(0),
    total_items_learned: integer('total_items_learned').default(0),

    // Timestamps
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex('profiles_username_idx').on(table.username),
    emailIdx: uniqueIndex('profiles_email_idx').on(table.email),
  })
)

// ============================================================================
// CONTENT TABLES
// ============================================================================

/**
 * Radicals - Building blocks of Chinese characters
 * Example: 人 (person), 氵(water), 木 (tree)
 *
 * RLS Policy: Public read access
 */
export const radicals = pgTable(
  'radicals',
  {
    id: serial('id').primaryKey(),
    character: text('character').notNull().unique(), // The radical character
    meaning: text('meaning').notNull(), // English meaning
    mnemonic: text('mnemonic'), // Memory aid
    stroke_count: integer('stroke_count').notNull(),
    sort_order: integer('sort_order').notNull(), // Display order

    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    characterIdx: uniqueIndex('radicals_character_idx').on(table.character),
    sortOrderIdx: index('radicals_sort_order_idx').on(table.sort_order),
  })
)

/**
 * Characters - Individual Chinese characters
 * Example: 你 (nǐ - you), 好 (hǎo - good)
 *
 * RLS Policy: Public read access
 */
export const characters = pgTable(
  'characters',
  {
    id: serial('id').primaryKey(),

    // Character data
    simplified: text('simplified').notNull().unique(), // 你
    traditional: text('traditional'), // 你 (same for this character)
    pinyin: text('pinyin').notNull(), // nǐ (with tone marks)
    pinyin_numeric: text('pinyin_numeric').notNull(), // ni3 (numeric tones)
    tone_marks: integer('tone_marks').array(), // [3] - array of tone numbers for each syllable

    // Meaning and learning aids
    meaning: text('meaning').notNull(), // "you"
    mnemonic: text('mnemonic'), // Memory aid for learning

    // Component radicals (array of radical IDs)
    component_radical_ids: integer('component_radical_ids').array(),

    // Classification
    hsk_level: hskLevelEnum('hsk_level').notNull(),
    frequency_rank: integer('frequency_rank'), // Usage frequency (lower = more common)

    // Visual learning aid
    stroke_order_url: text('stroke_order_url'), // Link to stroke order diagram

    // Timestamps
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    simplifiedIdx: uniqueIndex('characters_simplified_idx').on(table.simplified),
    hskLevelIdx: index('characters_hsk_level_idx').on(table.hsk_level),
    frequencyIdx: index('characters_frequency_idx').on(table.frequency_rank),
    pinyinIdx: index('characters_pinyin_idx').on(table.pinyin),
  })
)

/**
 * Vocabulary - Multi-character words
 * Example: 你好 (nǐhǎo - hello), 学习 (xuéxí - to study)
 *
 * RLS Policy: Public read access
 */
export const vocabulary = pgTable(
  'vocabulary',
  {
    id: serial('id').primaryKey(),

    // Word data
    word: text('word').notNull().unique(), // 你好
    pinyin: text('pinyin').notNull(), // nǐ hǎo (with tone marks)
    pinyin_numeric: text('pinyin_numeric').notNull(), // ni3 hao3
    translation: text('translation').notNull(), // "hello"

    // Example usage
    example_sentence: text('example_sentence'), // 你好，我是学生。
    example_translation: text('example_translation'), // "Hello, I am a student."

    // Component characters (array of character IDs)
    component_character_ids: integer('component_character_ids').array(),

    // Classification
    hsk_level: hskLevelEnum('hsk_level').notNull(),
    part_of_speech: text('part_of_speech'), // noun, verb, adjective, etc.

    // Timestamps
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wordIdx: uniqueIndex('vocabulary_word_idx').on(table.word),
    hskLevelIdx: index('vocabulary_hsk_level_idx').on(table.hsk_level),
    pinyinIdx: index('vocabulary_pinyin_idx').on(table.pinyin),
  })
)

/**
 * Lessons - Organized learning units
 * Example: "HSK 1 - Greetings", "HSK 2 - Food & Drink"
 *
 * RLS Policy: Public read access
 */
export const lessons = pgTable(
  'lessons',
  {
    id: serial('id').primaryKey(),

    // Lesson info
    level: integer('level').notNull(), // Lesson progression (1, 2, 3...)
    title: text('title').notNull(), // "HSK 1 - Greetings"
    description: text('description'), // What this lesson covers

    // Content (arrays of IDs)
    radical_ids: integer('radical_ids').array(), // Radicals taught in this lesson
    character_ids: integer('character_ids').array(), // Characters taught
    vocabulary_ids: integer('vocabulary_ids').array(), // Vocabulary taught

    // Unlock requirements
    unlock_requirement: integer('unlock_requirement'), // ID of previous lesson (null for first lesson)

    // Metadata
    sort_order: integer('sort_order').notNull(),
    is_published: boolean('is_published').default(true),

    // Timestamps
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    levelIdx: index('lessons_level_idx').on(table.level),
    sortOrderIdx: index('lessons_sort_order_idx').on(table.sort_order),
    isPublishedIdx: index('lessons_is_published_idx').on(table.is_published),
  })
)

// ============================================================================
// USER PROGRESS TABLES
// ============================================================================

/**
 * User Items - SRS state for each item per user
 * This is the core table for spaced repetition tracking
 *
 * RLS Policy: Users can only access their own items
 */
export const userItems = pgTable(
  'user_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Item reference
    item_id: integer('item_id').notNull(), // ID in radicals/characters/vocabulary table
    item_type: itemTypeEnum('item_type').notNull(),

    // SRS algorithm state
    srs_stage: srsStageEnum('srs_stage').notNull().default('new'),
    ease_factor: integer('ease_factor').notNull().default(2500), // Stored as 2500 = 2.5 (multiply by 1000)
    interval_days: integer('interval_days').notNull().default(0), // Days until next review
    current_step: integer('current_step').notNull().default(0), // Current position in learning/relearning steps (0-indexed)
    next_review_date: timestamp('next_review_date').notNull().defaultNow(),
    last_reviewed_at: timestamp('last_reviewed_at'),

    // Statistics
    total_reviews: integer('total_reviews').notNull().default(0),
    correct_count: integer('correct_count').notNull().default(0),
    incorrect_count: integer('incorrect_count').notNull().default(0),

    // Timestamps
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // CRITICAL: Index for review queue query (most important query)
    reviewQueueIdx: index('user_items_review_queue_idx').on(table.user_id, table.next_review_date),

    // Index for filtering by SRS stage
    userStageIdx: index('user_items_user_stage_idx').on(table.user_id, table.srs_stage),

    // Index for filtering by item type
    userTypeIdx: index('user_items_user_type_idx').on(table.user_id, table.item_type),

    // Unique constraint: one user_item per (user, item, type) combination
    userItemUniqueIdx: uniqueIndex('user_items_unique_idx').on(
      table.user_id,
      table.item_id,
      table.item_type
    ),
  })
)

/**
 * Review History - Detailed log of all reviews
 * Used for analytics and algorithm tuning
 *
 * RLS Policy: Users can only access their own review history
 */
export const reviewHistory = pgTable(
  'review_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Item reference
    item_id: integer('item_id').notNull(),
    item_type: itemTypeEnum('item_type').notNull(),

    // Review details
    question_type: questionTypeEnum('question_type').notNull(),
    user_answer: text('user_answer'), // User's pinyin input (e.g., "ni3" or "nǐ")
    correct_answer: text('correct_answer'), // Expected pinyin (e.g., "nǐ")
    is_correct: boolean('is_correct').notNull(),

    // SRS grading (0-3: Again, Hard, Good, Easy)
    grade: integer('grade').notNull(), // 0 = Again, 1 = Hard, 2 = Good, 3 = Easy

    // Response time
    response_time_ms: integer('response_time_ms'), // Time taken to answer

    // SRS state after review
    new_srs_stage: srsStageEnum('new_srs_stage').notNull(),
    new_interval: integer('new_interval').notNull(), // New interval in days

    // Timestamp
    reviewed_at: timestamp('reviewed_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index for user's review history
    userReviewedIdx: index('review_history_user_reviewed_idx').on(table.user_id, table.reviewed_at),

    // Index for item analysis
    itemTypeIdx: index('review_history_item_type_idx').on(table.item_id, table.item_type),
  })
)

/**
 * Daily Stats - Pre-aggregated statistics per day
 * Improves dashboard performance by avoiding real-time aggregations
 *
 * RLS Policy: Users can only access their own stats
 */
export const dailyStats = pgTable(
  'daily_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    stat_date: timestamp('stat_date').notNull(), // Date for these stats

    // Review stats
    reviews_completed: integer('reviews_completed').notNull().default(0),
    new_items_learned: integer('new_items_learned').notNull().default(0),
    accuracy_percentage: integer('accuracy_percentage').notNull().default(0), // 0-100
    time_spent_seconds: integer('time_spent_seconds').notNull().default(0),

    // Streak tracking
    streak_maintained: boolean('streak_maintained').notNull().default(false),

    // Timestamps
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one record per user per day
    userDateUniqueIdx: uniqueIndex('daily_stats_user_date_idx').on(table.user_id, table.stat_date),

    // Index for date range queries
    userDateRangeIdx: index('daily_stats_date_range_idx').on(table.user_id, table.stat_date),
  })
)

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Infer types from schema for use throughout the app
 */
export type Profile = typeof profiles.$inferSelect
export type ProfileInsert = typeof profiles.$inferInsert

export type Radical = typeof radicals.$inferSelect
export type RadicalInsert = typeof radicals.$inferInsert

export type Character = typeof characters.$inferSelect
export type CharacterInsert = typeof characters.$inferInsert

export type Vocabulary = typeof vocabulary.$inferSelect
export type VocabularyInsert = typeof vocabulary.$inferInsert

export type Lesson = typeof lessons.$inferSelect
export type LessonInsert = typeof lessons.$inferInsert

export type UserItem = typeof userItems.$inferSelect
export type UserItemInsert = typeof userItems.$inferInsert

export type ReviewHistory = typeof reviewHistory.$inferSelect
export type ReviewHistoryInsert = typeof reviewHistory.$inferInsert

export type DailyStats = typeof dailyStats.$inferSelect
export type DailyStatsInsert = typeof dailyStats.$inferInsert
