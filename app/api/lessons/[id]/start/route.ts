/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { getLessonById } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'
import { deleteCached } from '@/lib/cache/server'
import { and, eq, sql } from 'drizzle-orm'

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
      console.error('[StartLesson] Unauthorized', { authError })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email =
      user.email ??
      (typeof user.user_metadata?.email === 'string' ? user.user_metadata.email : undefined)

    if (!email) {
      console.error('[StartLesson] Missing email for user', { userId: user.id })
      return NextResponse.json(
        { error: 'User email missing; cannot create profile' },
        { status: 400 }
      )
    }

    // Ensure profile exists to satisfy FK on user_items.user_id
    await db
      .insert(schema.profiles)
      .values({
        id: user.id,
        email,
      })
      .onConflictDoNothing({ target: schema.profiles.id })

    const lessonId = Number.parseInt(params.id, 10)

    if (Number.isNaN(lessonId)) {
      console.error('[StartLesson] Invalid lesson id', { raw: params.id })
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 })
    }

    const lesson = await getLessonById(lessonId)

    if (!lesson) {
      console.error('[StartLesson] Lesson not found', { lessonId })
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const characterIds = lesson.character_ids || []
    const vocabularyIds = lesson.vocabulary_ids || []

    console.log('[StartLesson] Starting lesson', {
      lessonId,
      userId: user.id,
      characterCount: characterIds.length,
      vocabularyCount: vocabularyIds.length,
    })

    if (characterIds.length === 0 && vocabularyIds.length === 0) {
      console.error('[StartLesson] Lesson has no items', { lessonId })
      return NextResponse.json({ error: 'Lesson has no items to add' }, { status: 400 })
    }

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

    // Update profiles.total_items_learned if new items were added
    if (addedCount > 0) {
      await db
        .update(schema.profiles)
        .set({
          total_items_learned: sql`${schema.profiles.total_items_learned} + ${addedCount}`,
          updated_at: new Date(),
        })
        .where(eq(schema.profiles.id, user.id))

      // Update daily_stats.new_items_learned for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingStats = await db
        .select()
        .from(schema.dailyStats)
        .where(and(eq(schema.dailyStats.user_id, user.id), eq(schema.dailyStats.stat_date, today)))
        .limit(1)

      const existingStat = existingStats[0]
      if (existingStat) {
        // Update existing daily stats
        await db
          .update(schema.dailyStats)
          .set({
            new_items_learned: sql`${schema.dailyStats.new_items_learned} + ${addedCount}`,
            updated_at: new Date(),
          })
          .where(eq(schema.dailyStats.id, existingStat.id))
      } else {
        // Create new daily stats record for today
        await db.insert(schema.dailyStats).values({
          user_id: user.id,
          stat_date: today,
          reviews_completed: 0,
          new_items_learned: addedCount,
          accuracy_percentage: 0,
          time_spent_seconds: 0,
          streak_maintained: false,
        })
      }

      // Invalidate dashboard cache so stats refresh immediately
      await deleteCached(`dashboard:stats:${user.id}`)
    }

    console.log('[StartLesson] Completed', {
      lessonId,
      userId: user.id,
      totalItems: itemsToCreate.length,
      newItems: addedCount,
      existingItems: itemsToCreate.length - addedCount,
    })

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
    console.error('[StartLesson] Internal error', {
      error,
    })
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to start lesson. Please try again or contact support if the issue persists.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
