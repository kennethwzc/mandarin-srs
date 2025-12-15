/* eslint-disable no-console */
import { sql } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'

async function resetContent() {
  console.log('⚠️  WARNING: This will delete ALL content!')
  console.log('Content to be deleted:')
  console.log('  - All lessons')
  console.log('  - All vocabulary')
  console.log('  - All characters')
  console.log('  - All radicals\n')

  try {
    await db.delete(schema.lessons)
    console.log('  ✓ Deleted lessons')

    await db.delete(schema.vocabulary)
    console.log('  ✓ Deleted vocabulary')

    await db.delete(schema.characters)
    console.log('  ✓ Deleted characters')

    await db.delete(schema.radicals)
    console.log('  ✓ Deleted radicals')

    await db.execute(sql`ALTER SEQUENCE radicals_id_seq RESTART WITH 1`)
    await db.execute(sql`ALTER SEQUENCE characters_id_seq RESTART WITH 1`)
    await db.execute(sql`ALTER SEQUENCE vocabulary_id_seq RESTART WITH 1`)
    await db.execute(sql`ALTER SEQUENCE lessons_id_seq RESTART WITH 1`)

    console.log('\n✅ Content reset complete!')
    console.log('\nNext steps:')
    console.log('  1. Run: pnpm import:content')
    console.log('  2. Verify data in Supabase Dashboard')
  } catch (error) {
    console.error('\n❌ Reset failed:', error)
    throw error
  }
}

resetContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
