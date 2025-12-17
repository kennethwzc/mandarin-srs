/* eslint-disable no-console */
/**
 * Utility script to backfill profiles for existing users
 *
 * This script ensures all users with confirmed emails have corresponding
 * profiles in the public.profiles table.
 *
 * Run with: tsx scripts/backfill-profiles.ts
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 * - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js'
import { createUserProfile, getUserProfile } from '../lib/db/queries'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

/**
 * Main backfill function
 */
async function backfillProfiles() {
  console.log('🚀 Starting profile backfill process...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('📊 Fetching all users from auth.users...')

  const { data: usersData, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ Error fetching users:', error)
    return
  }

  const users = usersData.users
  console.log(`✓ Found ${users.length} total users\n`)

  let created = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    // Only process users with confirmed emails
    if (!user.email_confirmed_at) {
      console.log(`⏭️  Skipping ${user.email} - email not confirmed`)
      skipped++
      continue
    }

    try {
      // Check if profile exists
      const existingProfile = await getUserProfile(user.id)

      if (existingProfile) {
        console.log(`✓ Profile exists for ${user.email}`)
        skipped++
        continue
      }

      // Create profile
      await createUserProfile(user.id, user.email!, user.user_metadata?.username)

      console.log(`✅ Created profile for ${user.email}`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create profile for ${user.email}:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📈 BACKFILL SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Created:           ${created}`)
  console.log(`⏭️  Skipped (exists):   ${skipped}`)
  console.log(`❌ Failed:            ${failed}`)
  console.log(`📊 Total processed:   ${users.length}`)
  console.log('='.repeat(60) + '\n')

  if (created > 0) {
    console.log(`🎉 Successfully created ${created} new profile(s)`)
  }

  if (failed > 0) {
    console.log(`⚠️  ${failed} profile(s) failed to create - please investigate`)
  }
}

backfillProfiles()
  .then(() => {
    console.log('\n✓ Backfill complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Backfill failed:', error)
    process.exit(1)
  })
