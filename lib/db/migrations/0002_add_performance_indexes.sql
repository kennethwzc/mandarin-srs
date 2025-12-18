-- Performance Indexes Migration
-- Adds indexes to speed up common queries

-- User items indexes (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_review_queue 
ON user_items(user_id, next_review_date) 
WHERE next_review_date <= NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_user_stage 
ON user_items(user_id, srs_stage);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_user_type 
ON user_items(user_id, item_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_lesson_progress 
ON user_items(user_id, item_id, item_type);

-- Daily stats indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_stats_user_date 
ON daily_stats(user_id, stat_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_stats_date_range 
ON daily_stats(user_id) 
WHERE stat_date >= CURRENT_DATE - INTERVAL '365 days';

-- Review history indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_history_user_date 
ON review_history(user_id, reviewed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_history_recent 
ON review_history(user_id, reviewed_at) 
WHERE reviewed_at >= CURRENT_DATE - INTERVAL '90 days';

-- Characters indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_characters_hsk 
ON characters(hsk_level, frequency_rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_characters_pinyin 
ON characters(pinyin);

-- Vocabulary indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vocabulary_hsk 
ON vocabulary(hsk_level);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vocabulary_pinyin 
ON vocabulary(pinyin);

-- Lessons indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_sort 
ON lessons(sort_order) 
WHERE is_published = true;

-- Analyze tables after creating indexes
ANALYZE user_items;
ANALYZE daily_stats;
ANALYZE review_history;
ANALYZE characters;
ANALYZE vocabulary;
ANALYZE lessons;
