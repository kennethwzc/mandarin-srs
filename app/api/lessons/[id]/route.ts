/**
 * Single Lesson API Route
 *
 * Returns detailed information about a specific lesson including
 * all characters and vocabulary it contains.
 *
 * Dependencies: supabase, db/queries
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import {
  getLessonById,
  getCharactersByIds,
  getVocabularyByIds,
  hasUserStartedLesson,
  hasUserCompletedLesson,
} from '@/lib/db/queries'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/lessons/[id]
 * Returns a specific lesson with its characters and vocabulary
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lessonId = parseInt(params.id, 10)

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
    }

    const lesson = await getLessonById(lessonId)

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Fetch characters and vocabulary in parallel
    const [characters, vocabulary] = await Promise.all([
      getCharactersByIds(lesson.character_ids ?? []),
      getVocabularyByIds(lesson.vocabulary_ids ?? []),
    ])

    // Check user progress if authenticated
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let isStarted = false
    let isCompleted = false

    if (user) {
      ;[isStarted, isCompleted] = await Promise.all([
        hasUserStartedLesson(user.id, lessonId),
        hasUserCompletedLesson(user.id, lessonId),
      ])
    }

    return NextResponse.json({
      success: true,
      data: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        sortOrder: lesson.sort_order,
        characters: characters.map((c) => ({
          id: c.id,
          character: c.simplified,
          pinyin: c.pinyin,
          meaning: c.meaning,
        })),
        vocabulary: vocabulary.map((v) => ({
          id: v.id,
          word: v.word,
          pinyin: v.pinyin,
          translation: v.translation,
        })),
        isStarted,
        isCompleted,
      },
    })
  } catch (error) {
    logger.error('Error fetching lesson', {
      error: error instanceof Error ? error.message : String(error),
      lessonId: params.id,
    })
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}
