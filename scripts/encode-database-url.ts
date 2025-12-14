/**
 * Helper script to properly encode DATABASE_URL
 *
 * Passwords with special characters (@, :, /, ?, #, etc.) need to be URL-encoded
 *
 * Run with: pnpm tsx scripts/encode-database-url.ts
 */

/* eslint-disable no-console */

import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function encodeUrl() {
  console.log('🔐 DATABASE_URL Encoder\n')
  console.log('This script will help you create a properly encoded DATABASE_URL')
  console.log('Passwords with special characters (@, :, /, etc.) must be URL-encoded\n')

  const host = await question('Supabase host (e.g., db.xxx.supabase.co): ')
  const password = await question('Database password: ')

  // URL encode the password
  const encodedPassword = encodeURIComponent(password)

  // Construct the DATABASE_URL
  const databaseUrl = `postgresql://postgres:${encodedPassword}@${host}:5432/postgres`

  console.log('\n✅ Your encoded DATABASE_URL:\n')
  console.log(databaseUrl)
  console.log('\n📋 Copy this to your .env.local file:')
  console.log(`DATABASE_URL=${databaseUrl}\n`)

  if (password !== encodedPassword) {
    console.log('⚠️  Your password was encoded:')
    console.log(`   Original:  ${password}`)
    console.log(`   Encoded:   ${encodedPassword}\n`)
  }

  rl.close()
}

encodeUrl().catch((error) => {
  console.error('Error:', error)
  rl.close()
  process.exit(1)
})
