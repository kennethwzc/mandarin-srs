/**
 * Database client for Drizzle ORM
 *
 * Uses postgres.js for connection pooling and performance.
 * Connection string comes from DATABASE_URL environment variable.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

// Validate environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

/**
 * Create postgres connection
 *
 * Configuration:
 * - max: 10 connections (sufficient for serverless)
 * - idle_timeout: 20 seconds
 * - connect_timeout: 10 seconds
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

/**
 * Drizzle database instance
 * Use this for all database operations
 *
 * @example
 * ```ts
 * import { db } from '@/lib/db/client'
 *
 * const users = await db.select().from(schema.profiles)
 * ```
 */
export const db = drizzle(client, { schema })
