import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { getLessonById } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'
import { and, eq } from 'drizzle-orm'

/**
 * POST /api/lessons/[id]/start
 *
 * Start a lesson by adding all its items to the user's review queue.
 * Creates user_items entries for each character and vocabulary item with SRS stage "new".
 */
export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lessonId = Number.parseInt(params.id, 10)
    const lesson = await getLessonById(lessonId)

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const characterIds = lesson.character_ids || []
    const vocabularyIds = lesson.vocabulary_ids || []

    const itemsToCreate: Array<{
      user_id: string
      item_id: number
      item_type: 'character' | 'vocabulary'
    }> = []

    for (const charId of characterIds) {
      itemsToCreate.push({
        user_id: user.id,
        item_id: charId,
        item_type: 'character',
      })
    }

    for (const vocabId of vocabularyIds) {
      itemsToCreate.push({
        user_id: user.id,
        item_id: vocabId,
        item_type: 'vocabulary',
      })
    }

    let addedCount = 0

    for (const item of itemsToCreate) {
      const existing = await db
        .select()
        .from(schema.userItems)
        .where(
          and(
            eq(schema.userItems.user_id, item.user_id),
            eq(schema.userItems.item_id, item.item_id),
            eq(schema.userItems.item_type, item.item_type)
          )
        )
        .limit(1)

      if (existing.length === 0) {
        await db.insert(schema.userItems).values({
          user_id: item.user_id,
          item_id: item.item_id,
          item_type: item.item_type,
          srs_stage: 'new',
          ease_factor: 2500,
          interval_days: 0,
          next_review_date: new Date(),
        })
        addedCount++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lessonId,
        totalItems: itemsToCreate.length,
        newItems: addedCount,
        existingItems: itemsToCreate.length - addedCount,
      },
    })
  } catch (error) {
    console.error('Error starting lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
