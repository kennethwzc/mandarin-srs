/**
 * Create a Supabase client for use in Next.js middleware
 *
 * This is a special client that can modify request/response headers
 * to manage session cookies during middleware execution.
 *
 * @param request - Next.js request object
 * @returns Tuple of [supabase client, response object]
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/database'

export async function createClient(request: NextRequest) {
  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: Array<{
          name: string
          value: string
          options?: CookieOptions
        }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Set cookie on request (for current middleware execution)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie on response (for client to receive)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        })
      },
    },
  })

  return { supabase, response }
}

/**
 * Get the authenticated user from the session
 * Returns null if no session exists
 */
export async function getUser(request: NextRequest) {
  const { supabase } = await createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Verify user is authenticated, redirect to login if not
 *
 * @param request - Next.js request
 * @param redirectTo - URL to redirect after login (optional)
 * @returns User if authenticated, null and redirects if not
 */
export async function requireAuth(request: NextRequest, redirectTo?: string) {
  const user = await getUser(request)

  if (!user) {
    const url = new URL('/login', request.url)
    if (redirectTo) {
      url.searchParams.set('redirectTo', redirectTo)
    }
    return { user: null, redirect: NextResponse.redirect(url) }
  }

  return { user, redirect: null }
}
