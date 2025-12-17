/**
 * Database client for Drizzle ORM
 *
 * Uses postgres.js for connection pooling and performance.
 * Connection string comes from DATABASE_URL environment variable.
 *
 * Lazy initialization: Connection is only created when first accessed.
 * This allows the build to succeed without DATABASE_URL, and errors
 * will only occur at runtime when the database is actually used.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import dotenv from 'dotenv'

import * as schema from './schema'

let _client: postgres.Sql | null = null
let _db: PostgresJsDatabase<typeof schema> | null = null

/**
 * Get or create the postgres client
 * Lazy initialization ensures connection is only created when needed
 */
function getClient(): postgres.Sql {
  if (_client) {
    return _client
  }

  // Load environment variables if not already loaded
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.local' })
  }

  // Validate environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set in environment variables. ' +
        'This is required for database operations. ' +
        'Set it in your .env.local file or environment variables.'
    )
  }

  /**
   * Create postgres connection
   *
   * Configuration optimized for Vercel serverless:
   * - max: 25 connections (handles concurrent serverless instances)
   * - idle_timeout: 30 seconds (prevents mid-request connection closes)
   * - connect_timeout: 15 seconds (accommodates slow network handshakes)
   * - max_lifetime: 30 minutes (forces periodic connection refresh)
   *
   * These values prevent "Connection closed" errors under load.
   */
  _client = postgres(process.env.DATABASE_URL, {
    max: 25, // Increased for production concurrency
    idle_timeout: 30, // Longer timeout to avoid mid-request closes
    connect_timeout: 15, // More time for slow networks
    max_lifetime: 60 * 30, // 30 minutes max connection lifetime
  })

  return _client
}

/**
 * Get or create the Drizzle database instance
 * Lazy initialization ensures it's only created when first accessed
 */
function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) {
    return _db
  }

  const client = getClient()
  _db = drizzle(client, { schema })
  return _db
}

/**
 * Drizzle database instance
 * Use this for all database operations
 *
 * Lazy initialization: Connection is only created when first accessed.
 * This allows builds to succeed without DATABASE_URL, and errors will
 * only occur at runtime when the database is actually used.
 *
 * @example
 * ```ts
 * import { db } from '@/lib/db/client'
 *
 * const users = await db.select().from(schema.profiles)
 * ```
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const dbInstance = getDb()
    const value = dbInstance[prop as keyof typeof dbInstance]
    // Ensure methods are bound correctly
    if (typeof value === 'function') {
      return value.bind(dbInstance)
    }
    return value
  },
})
