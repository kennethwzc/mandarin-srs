/**
 * Supabase client for server-side usage
 *
 * This client is used for:
 * - Server-side data fetching
 * - API routes
 * - Server Actions
 *
 * Cookies are managed automatically for session persistence.
 *
 * @example
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('users').select('*')
 *
 *   return <div>{data}</div>
 * }
 * ```
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: Array<{
          name: string
          value: string
          options?: CookieOptions
        }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            if (value === '') {
              // Cookie deletion requires matching all attributes used when setting
              cookieStore.set(name, '', { ...options, maxAge: 0 })
            } else {
              cookieStore.set({ name, value, ...options })
            }
          } catch (error) {
            // Handle error in middleware where cookies can't be set
            // This is expected in some contexts (e.g., static generation)
          }
        })
      },
    },
  })
}

/**
 * Create a Supabase admin client with service role
 *
 * ⚠️ WARNING: This client bypasses Row Level Security!
 * Only use for:
 * - Admin operations
 * - Background jobs
 * - System-level operations
 *
 * NEVER expose this client or its results directly to users.
 *
 * @example
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase/server'
 *
 * export async function deleteUser(userId: string) {
 *   const supabase = createAdminClient()
 *
 *   // This bypasses RLS - use with caution!
 *   await supabase.from('users').delete().eq('id', userId)
 * }
 * ```
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY - required for admin operations')
  }
  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }

  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return cookies().getAll()
      },
      setAll(
        cookiesToSet: Array<{
          name: string
          value: string
          options?: CookieOptions
        }>
      ) {
        const cookieStore = cookies()
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            if (value === '') {
              cookieStore.set(name, '', { ...options, maxAge: 0 })
            } else {
              cookieStore.set({ name, value, ...options })
            }
          } catch (error) {
            // Ignore errors in contexts where cookies can't be set
          }
        })
      },
    },
  })
}
