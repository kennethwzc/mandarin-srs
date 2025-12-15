/* eslint-disable no-console */

import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n')

  try {
    console.log('📚 Checking lessons table...')
    const lessons = await db.select().from(schema.lessons)
    console.log(`   Found ${lessons.length} lessons`)

    if (lessons.length === 0) {
      console.log('   ❌ No lessons found!')
      console.log('   → Run: pnpm db:seed')
    } else {
      console.log('   ✓ Lessons table has data')
      lessons.forEach((lesson) => {
        console.log(`     - ${lesson.id}: ${lesson.title}`)
        console.log(`       Characters: ${lesson.character_ids?.length || 0}`)
        console.log(`       Vocabulary: ${lesson.vocabulary_ids?.length || 0}`)
      })
    }

    console.log('\n📝 Checking characters table...')
    const characters = await db.select().from(schema.characters).limit(5)
    console.log(`   Found ${characters.length} characters (showing first 5)`)
    if (characters.length === 0) {
      console.log('   ❌ No characters found!')
      console.log('   → Run: pnpm db:seed')
    } else {
      console.log('   ✓ Characters table has data')
      characters.forEach((char) => {
        console.log(`     - ${char.simplified} (${char.pinyin}) - ${char.meaning}`)
      })
    }

    console.log('\n📖 Checking vocabulary table...')
    const vocabulary = await db.select().from(schema.vocabulary).limit(5)
    console.log(`   Found ${vocabulary.length} vocabulary (showing first 5)`)
    if (vocabulary.length === 0) {
      console.log('   ❌ No vocabulary found!')
      console.log('   → Run: pnpm db:seed')
    } else {
      console.log('   ✓ Vocabulary table has data')
      vocabulary.forEach((vocab) => {
        console.log(`     - ${vocab.word} (${vocab.pinyin}) - ${vocab.translation}`)
      })
    }

    console.log('\n🔒 Checking RLS policies on lessons table...')
    const policies = await db.execute(sql`
      SELECT tablename, policyname, permissive, roles, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'lessons'
    `)
    const policyRows = policies.rows as { policyname: string; cmd: string }[]
    console.log(`   Found ${policyRows.length} RLS policies on lessons table`)
    policyRows.forEach((policy) => {
      console.log(`     - ${policy.policyname}: ${policy.cmd}`)
    })

    console.log('\n✅ Database verification complete!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database verification failed!')
    console.error('Error:', error)
    process.exit(1)
  }
}

verifyDatabase()
