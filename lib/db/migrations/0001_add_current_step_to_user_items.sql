-- Add current_step to user_items to track learning/relearning step progression
ALTER TABLE user_items
ADD COLUMN IF NOT EXISTS current_step INTEGER NOT NULL DEFAULT 0;
