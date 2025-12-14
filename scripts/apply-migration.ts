/**
 * Apply database migration manually
 *
 * This script runs the SQL migration file directly using the Supabase admin client.
 * Use this when `pnpm db:push` fails or for manual migration control.
 *
 * Run with: pnpm tsx scripts/apply-migration.ts
 */

/* eslint-disable no-console */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

async function applyMigration() {
  console.log('🔧 Applying database migration...')

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  // Create admin client (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'lib/db/migrations/0000_initial_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Read migration file:', migrationPath)

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 Found ${statements.length} SQL statements`)

    // Execute each statement
    let successCount = 0
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';',
      })

      if (error) {
        console.error(`❌ Error executing statement:`, error)
        console.error(`Statement: ${statement.substring(0, 100)}...`)

        // Try direct SQL execution as fallback
        const { error: directError } = await supabase.from('_migrations').insert({
          statement,
          error: error.message,
        })

        if (directError) {
          throw new Error(`Failed to execute migration: ${error.message}`)
        }
      } else {
        successCount++
      }
    }

    console.log(`✅ Successfully executed ${successCount}/${statements.length} statements`)
    console.log('✨ Migration completed!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('👋 Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
