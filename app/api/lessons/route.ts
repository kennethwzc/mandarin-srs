/**
 * Lessons List API Route
 *
 * Returns all published lessons with user progress information.
 * Lessons are ordered by sort_order for proper progression.
 *
 * Dependencies: supabase, db/queries
 */

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getAllLessons, getUserLessonProgress } from '@/lib/db/queries'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/lessons
 * Returns all available lessons with user progress
 */
export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Allow unauthenticated access to lesson list (public data)
    // But progress will only be included for authenticated users
    const lessons = await getAllLessons()

    // If authenticated, include progress
    let lessonsWithProgress = lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      sortOrder: lesson.sort_order,
      characterCount: lesson.character_ids?.length ?? 0,
      vocabularyCount: lesson.vocabulary_ids?.length ?? 0,
      isStarted: false,
      isCompleted: false,
      isUnlocked: lesson.sort_order === 1,
    }))

    if (!authError && user) {
      const progress = await getUserLessonProgress(user.id)
      const progressMap = new Map(progress.map((p) => [p.id, p]))

      lessonsWithProgress = lessonsWithProgress.map((lesson) => {
        const userProgress = progressMap.get(lesson.id)
        return {
          ...lesson,
          isStarted: userProgress?.isStarted ?? false,
          isCompleted: userProgress?.isCompleted ?? false,
          isUnlocked: userProgress?.isUnlocked ?? lesson.sortOrder === 1,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessonsWithProgress,
        total: lessonsWithProgress.length,
      },
    })
  } catch (error) {
    logger.error('Error fetching lessons', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}
