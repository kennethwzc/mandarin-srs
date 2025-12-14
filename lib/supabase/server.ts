/**
 * Supabase client for server-side usage
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(
        name: string,
        value: string,
        options: {
          path?: string
          maxAge?: number
          httpOnly?: boolean
          secure?: boolean
          sameSite?: 'lax' | 'strict' | 'none'
          domain?: string
        }
      ) {
        cookieStore.set(name, value, options)
      },
      remove(
        name: string,
        options: {
          path?: string
          domain?: string
          httpOnly?: boolean
          secure?: boolean
          sameSite?: 'lax' | 'strict' | 'none'
        }
      ) {
        // Cookie deletion requires matching all attributes used when setting
        // Setting maxAge to 0 effectively deletes the cookie
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })
}
