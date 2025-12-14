/**
 * Drizzle ORM database client
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

// Create postgres connection
const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString)

// Create drizzle instance
export const db = drizzle(client, { schema })
