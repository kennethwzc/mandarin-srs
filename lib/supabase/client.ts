/**
 * Create a Supabase client for use in Client Components
 *
 * This client is used for:
 * - Client-side authentication (login, signup, logout)
 * - Real-time subscriptions (if needed in future)
 * - Client-side queries (with RLS enforcement)
 *
 * IMPORTANT: This client uses the anon key which is safe to expose.
 * Row Level Security (RLS) policies protect data access.
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *
 *   async function handleLogin(email: string, password: string) {
 *     const { data, error } = await supabase.auth.signInWithPassword({
 *       email,
 *       password,
 *     })
 *   }
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
