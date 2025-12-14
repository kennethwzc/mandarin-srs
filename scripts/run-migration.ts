/**
 * Run migration directly using postgres client
 * This bypasses drizzle-kit and runs the SQL file directly
 */

/* eslint-disable no-console */

import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function runMigration() {
  console.log('🔧 Running migration...')

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set in .env.local')
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
  })

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'lib/db/migrations/0000_initial_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Running migration file:', migrationPath)
    console.log('')

    // Execute the entire migration
    await sql.unsafe(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('Tables created:')
    console.log('  • profiles')
    console.log('  • radicals')
    console.log('  • characters')
    console.log('  • vocabulary')
    console.log('  • lessons')
    console.log('  • user_items')
    console.log('  • review_history')
    console.log('  • daily_stats')
    console.log('')
    console.log('✨ Next step: Run pnpm db:seed to populate content')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await sql.end()
    process.exit(1)
  }
}

runMigration()
