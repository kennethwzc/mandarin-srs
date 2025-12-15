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

import { createBrowserClient, type CookieOptions } from '@supabase/ssr'

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

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split('; ').map((cookie) => {
          const [name, ...rest] = cookie.split('=')
          return { name: name || '', value: rest.join('=') }
        })
      },
      setAll(
        cookiesToSet: Array<{
          name: string
          value: string
          options?: CookieOptions
        }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Build cookie string with all options
          let cookieString = `${name}=${value}`

          // Add path
          cookieString += `; path=${options?.path || '/'}`

          // Add maxAge (convert to expires if needed)
          if (options?.maxAge) {
            cookieString += `; max-age=${options.maxAge}`
          }

          // Add expires if provided (for compatibility)
          if (options?.expires) {
            cookieString += `; expires=${options.expires.toUTCString()}`
          }

          // Add domain
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`
          }

          // Add sameSite
          if (options?.sameSite) {
            cookieString += `; samesite=${options.sameSite}`
          }

          // Add secure flag
          if (options?.secure) {
            cookieString += '; secure'
          }

          // Add httpOnly flag (note: can't be set from JS, but include for completeness)
          // httpOnly cookies can only be set server-side

          // Set the cookie
          document.cookie = cookieString
        })
      },
    },
  })
}
