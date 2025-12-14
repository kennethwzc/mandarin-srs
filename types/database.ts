/**
 * Database types generated from Drizzle schema
 *
 * Import these types throughout the application for type safety.
 */

export * from '@/lib/db/schema'

// Re-export commonly used types
export type {
  Profile,
  ProfileInsert,
  Radical,
  RadicalInsert,
  Character,
  CharacterInsert,
  Vocabulary,
  VocabularyInsert,
  Lesson,
  LessonInsert,
  UserItem,
  UserItemInsert,
  ReviewHistory,
  ReviewHistoryInsert,
  DailyStats,
  DailyStatsInsert,
} from '@/lib/db/schema'

// Legacy Supabase type for compatibility
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
