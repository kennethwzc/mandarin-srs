# Database Schema Documentation

## Overview

This document describes the complete PostgreSQL database schema for the Mandarin SRS platform, implemented using Drizzle ORM.

**Focus:** Pinyin typing practice - NO audio fields or storage buckets.

## Schema Files

- `lib/db/schema.ts` — Drizzle table definitions and types
- `lib/db/client.ts` — Database client configuration
- `lib/db/queries.ts` — Common optimized queries
- `lib/db/seed.ts` — Seed script with HSK 1 content
- `lib/db/migrations/0000_initial_schema.sql` — SQL migration with RLS policies

## Tables

### Content Tables (Read-only for users)

#### `radicals`

Building blocks of Chinese characters (214 total)

- `id` SERIAL PRIMARY KEY
- `character` TEXT — The radical (人, 口, 木...)
- `meaning` TEXT — English meaning
- `mnemonic` TEXT — Memory aid
- `stroke_count` INTEGER
- `sort_order` INTEGER — Display order

**Indexes:**

- `radicals_character_idx` (UNIQUE) on `character`
- `radicals_sort_order_idx` on `sort_order`

#### `characters`

Individual Chinese characters (~600 for HSK 1-3)

- `id` SERIAL PRIMARY KEY
- `simplified` TEXT — Simplified character (你)
- `traditional` TEXT — Traditional character
- `pinyin` TEXT — With tone marks (nǐ)
- `pinyin_numeric` TEXT — Numeric tones (ni3)
- `tone_marks` INTEGER[] — Array of tones [3]
- `meaning` TEXT — English meaning
- `mnemonic` TEXT — Memory aid
- `component_radical_ids` INTEGER[] — Component radicals
- `hsk_level` ENUM — HSK level (1-6)
- `frequency_rank` INTEGER — Usage frequency
- `stroke_order_url` TEXT — Link to diagram

**Indexes:**

- `characters_simplified_idx` (UNIQUE) on `simplified`
- `characters_hsk_level_idx` on `hsk_level`
- `characters_frequency_idx` on `frequency_rank`
- `characters_pinyin_idx` on `pinyin`

#### `vocabulary`

Multi-character words (~1200 for HSK 1-3)

- `id` SERIAL PRIMARY KEY
- `word` TEXT — The word (你好)
- `pinyin` TEXT — With tone marks (nǐ hǎo)
- `pinyin_numeric` TEXT — Numeric tones (ni3 hao3)
- `translation` TEXT — English translation
- `example_sentence` TEXT — Chinese example
- `example_translation` TEXT — English example
- `component_character_ids` INTEGER[] — Component characters
- `hsk_level` ENUM — HSK level (1-6)
- `part_of_speech` TEXT — noun, verb, etc.

**Indexes:**

- `vocabulary_word_idx` (UNIQUE) on `word`
- `vocabulary_hsk_level_idx` on `hsk_level`
- `vocabulary_pinyin_idx` on `pinyin`

#### `lessons`

Organized learning units

- `id` SERIAL PRIMARY KEY
- `level` INTEGER — Lesson number
- `title` TEXT — Lesson title
- `description` TEXT — What it covers
- `radical_ids` INTEGER[] — Radicals taught
- `character_ids` INTEGER[] — Characters taught
- `vocabulary_ids` INTEGER[] — Vocabulary taught
- `unlock_requirement` INTEGER — Previous lesson ID
- `sort_order` INTEGER — Display order
- `is_published` BOOLEAN — Visibility

**Indexes:**

- `lessons_level_idx` on `level`
- `lessons_sort_order_idx` on `sort_order`
- `lessons_is_published_idx` on `is_published`

### User Tables (RLS enforced)

#### `profiles`

User profiles (extends auth.users)

- `id` UUID PRIMARY KEY → auth.users(id)
- `username` TEXT UNIQUE
- `email` TEXT UNIQUE
- `timezone` TEXT (default: UTC)
- `daily_new_items_limit` INTEGER (default: 10)
- `daily_review_limit` INTEGER (default: 100)
- `current_streak` INTEGER
- `longest_streak` INTEGER
- `total_items_learned` INTEGER

**Indexes:**

- `profiles_username_idx` (UNIQUE) on `username`
- `profiles_email_idx` (UNIQUE) on `email`

**RLS Policies:**

- Users can SELECT, INSERT, UPDATE their own profile only

#### `user_items`

SRS state for each item per user (core table)

- `id` UUID PRIMARY KEY
- `user_id` UUID → profiles(id)
- `item_id` INTEGER — ID in content table
- `item_type` ENUM — radical/character/vocabulary
- `srs_stage` ENUM — new/learning/review/relearning
- `ease_factor` INTEGER — SM-2 ease (2500 = 2.5)
- `interval_days` INTEGER — Days until next review
- `next_review_date` TIMESTAMP — When to review
- `last_reviewed_at` TIMESTAMP
- `total_reviews` INTEGER
- `correct_count` INTEGER
- `incorrect_count` INTEGER

**Indexes (CRITICAL for performance):**

- `user_items_review_queue_idx` on `(user_id, next_review_date)` — For review queue
- `user_items_user_stage_idx` on `(user_id, srs_stage)`
- `user_items_user_type_idx` on `(user_id, item_type)`
- `user_items_unique_idx` (UNIQUE) on `(user_id, item_id, item_type)`

**RLS Policies:**

- Users can SELECT, INSERT, UPDATE, DELETE their own items only

#### `review_history`

Detailed log of all reviews

- `id` UUID PRIMARY KEY
- `user_id` UUID → profiles(id)
- `item_id` INTEGER
- `item_type` ENUM
- `question_type` ENUM — meaning_to_pinyin
- `user_answer` TEXT — User's input
- `correct_answer` TEXT — Expected answer
- `is_correct` BOOLEAN
- `grade` INTEGER — 0-3 (Again/Hard/Good/Easy)
- `response_time_ms` INTEGER
- `new_srs_stage` ENUM — SRS stage after review
- `new_interval` INTEGER — New interval after review
- `reviewed_at` TIMESTAMP

**Indexes:**

- `review_history_user_reviewed_idx` on `(user_id, reviewed_at)`
- `review_history_item_type_idx` on `(item_id, item_type)`

**RLS Policies:**

- Users can SELECT, INSERT their own review history only

#### `daily_stats`

Pre-aggregated daily statistics

- `id` UUID PRIMARY KEY
- `user_id` UUID → profiles(id)
- `stat_date` TIMESTAMP
- `reviews_completed` INTEGER
- `new_items_learned` INTEGER
- `accuracy_percentage` INTEGER (0-100)
- `time_spent_seconds` INTEGER
- `streak_maintained` BOOLEAN

**Indexes:**

- `daily_stats_user_date_idx` (UNIQUE) on `(user_id, stat_date)`
- `daily_stats_date_range_idx` on `(user_id, stat_date)`

**RLS Policies:**

- Users can SELECT, INSERT, UPDATE their own stats only

## Enums

- `item_type`: radical | character | vocabulary
- `srs_stage`: new | learning | review | relearning
- `question_type`: meaning_to_pinyin
- `hsk_level`: 1 | 2 | 3 | 4 | 5 | 6

## Performance Optimizations

### Review Queue Query (<50ms target)

```sql
SELECT * FROM user_items
WHERE user_id = $1
  AND next_review_date <= NOW()
ORDER BY next_review_date
LIMIT 50;
```

Uses index: `user_items_review_queue_idx`

### Dashboard Stats

Pre-aggregated in `daily_stats` table to avoid slow aggregations.

### Content Queries

Indexed by HSK level and frequency for fast lesson loading.

## Row Level Security (RLS)

All user tables enforce RLS:

- **Profiles**: Users can only access their own
- **User Items**: Users can only access their own
- **Review History**: Users can only access their own
- **Daily Stats**: Users can only access their own
- **Content**: All authenticated users have read access

## Database Setup

### 1. Apply Migration

```bash
pnpm db:push
```

This will:

- Create all tables
- Create all indexes
- Enable RLS
- Create RLS policies
- Create triggers

### 2. Seed Database

```bash
pnpm db:seed
```

This will populate:

- 10 radicals
- 15 HSK 1 characters
- 15 HSK 1 vocabulary words
- 3 lessons

### 3. Verify in Supabase

1. Go to Dashboard → Database → Tables
2. Verify all tables exist
3. Go to Authentication → Policies
4. Verify RLS policies are active

## Common Queries

All queries are in `lib/db/queries.ts`:

- `getReviewQueue(userId, limit)` — Get items due for review
- `getUpcomingReviewsCount(userId)` — Count reviews in next 24h
- `getUserProfile(userId)` — Get user profile
- `createUserProfile(userId, email)` — Create profile after signup
- `getDashboardStats(userId)` — Get dashboard statistics
- `getRecentReviews(userId, limit)` — Get review history
- `getDailyStatsRange(userId, start, end)` — Get stats for date range
- `getAllLessons()` — Get all published lessons
- `getLessonById(id)` — Get specific lesson
- `getCharacterById(id)` — Get character by ID
- `getVocabularyById(id)` — Get vocabulary by ID
- `getCharactersByHSK(level)` — Get characters for HSK level
- `getVocabularyByHSK(level)` — Get vocabulary for HSK level

## Scaling Considerations

For 50,000+ users:

1. **Connection Pooling**: postgres.js with max 10 connections
2. **Indexes**: All critical queries use indexes
3. **RLS**: Security without application-level checks
4. **Pre-aggregation**: `daily_stats` avoids slow aggregations
5. **Partial Indexes**: `review_history_recent_idx` only indexes last 90 days

## Next Steps

After database setup:

1. ✅ PROMPT 3 (Database Schema) - you are here
2. → PROMPT 4 (SRS Algorithm)
3. → PROMPT 5 (Review Interface)

## Notes

⚠️ **NO AUDIO FUNCTIONALITY**

- No audio file storage
- No audio URLs
- No storage buckets
- Focus: Pinyin typing only

✅ **Type Safety**

All types are exported from `types/database.ts` for use throughout the app.
