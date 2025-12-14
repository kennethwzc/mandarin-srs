/**
 * Drizzle ORM schema for Mandarin SRS
 * This is a placeholder schema - will be fully implemented in PROMPT 2
 */

import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core'

// Users table (extends Supabase auth.users)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Lessons table
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Characters table
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  character: text('character').notNull().unique(),
  pinyin: text('pinyin').notNull(),
  meaning: text('meaning'),
  lessonId: uuid('lesson_id').references(() => lessons.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// User progress table (SRS algorithm state)
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  characterId: uuid('character_id')
    .references(() => characters.id)
    .notNull(),
  easeFactor: integer('ease_factor').default(250).notNull(), // SM-2 algorithm
  interval: integer('interval').default(1).notNull(), // Days until next review
  repetitions: integer('repetitions').default(0).notNull(),
  nextReviewDate: timestamp('next_review_date').notNull(),
  lastReviewed: timestamp('last_reviewed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Review history table
export const reviewHistory = pgTable('review_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  characterId: uuid('character_id')
    .references(() => characters.id)
    .notNull(),
  userAnswer: text('user_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  reviewDate: timestamp('review_date').defaultNow().notNull(),
})
