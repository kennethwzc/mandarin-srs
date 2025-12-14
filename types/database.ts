/**
 * Database types generated from Drizzle schema
 * This is a placeholder - will be generated from schema in PROMPT 2
 */

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'

export type User = InferSelectModel<typeof schema.users>
export type UserInsert = InferInsertModel<typeof schema.users>

export type Lesson = InferSelectModel<typeof schema.lessons>
export type LessonInsert = InferInsertModel<typeof schema.lessons>

export type Character = InferSelectModel<typeof schema.characters>
export type CharacterInsert = InferInsertModel<typeof schema.characters>

export type UserProgress = InferSelectModel<typeof schema.userProgress>
export type UserProgressInsert = InferInsertModel<typeof schema.userProgress>

export type ReviewHistory = InferSelectModel<typeof schema.reviewHistory>
export type ReviewHistoryInsert = InferInsertModel<typeof schema.reviewHistory>
