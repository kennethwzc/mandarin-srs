import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth-middleware'
import { getLessonById, getCharactersByIds, getVocabularyByIds } from '@/lib/db/queries'

/**
 * GET /api/lessons/[id]/practice
 *
 * Get ALL items from a lesson for practice mode.
 * Does NOT check SRS state or update any tracking.
 * Items are returned in a format compatible with the review/practice session.
 *
 * Returns:
 * - Array of all lesson items (characters and vocabulary)
 * - Lesson metadata
 */

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user
    const auth = await requireAuth()
    if (auth.error) {
      return auth.error
    }

    // 2. Parse lesson ID
    const lessonId = Number.parseInt(params.id, 10)

    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
    }

    // 3. Get lesson
    const lesson = await getLessonById(lessonId)

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // 4. Fetch all characters and vocabulary for this lesson
    const characterIds = lesson.character_ids || []
    const vocabularyIds = lesson.vocabulary_ids || []

    const [characters, vocabulary] = await Promise.all([
      getCharactersByIds(characterIds),
      getVocabularyByIds(vocabularyIds),
    ])

    // 5. Transform to practice format (compatible with review session)
    const practiceItems = [
      ...characters.map((char) => ({
        item_id: char.id,
        item_type: 'character' as const,
        character: char.simplified,
        pinyin: char.pinyin,
        meaning: char.meaning,
      })),
      ...vocabulary.map((vocab) => ({
        item_id: vocab.id,
        item_type: 'vocabulary' as const,
        character: vocab.word,
        pinyin: vocab.pinyin,
        meaning: vocab.translation,
      })),
    ]

    // 6. Shuffle items for variety
    const shuffledItems = practiceItems.sort(() => Math.random() - 0.5)

    // 7. Return practice items with lesson metadata
    return NextResponse.json({
      success: true,
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          level: lesson.level,
        },
        items: shuffledItems,
        count: shuffledItems.length,
      },
    })
  } catch (error) {
    console.error('Error fetching practice items:', error)
    return NextResponse.json(
      {
        error: 'Failed to load practice items. Please try again.',
      },
      { status: 500 }
    )
  }
}
