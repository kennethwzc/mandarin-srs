/**
 * Centralized API authentication middleware
 *
 * Provides a unified way to authenticate API requests, ensuring:
 * - Consistent error responses across all routes
 * - Single point of maintenance for auth logic
 * - Type-safe user objects
 *
 * @example
 * ```ts
 * import { requireAuth } from '@/lib/api/auth-middleware'
 *
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth()
 *   if (auth.error) return auth.error
 *   const { user } = auth
 *
 *   // user.id is now available
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

/**
 * Unauthorized response with consistent format
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}

/**
 * Authentication result type for successful authentication
 */
export interface AuthSuccess {
  user: User
  error: null
}

/**
 * Authentication result type for failed authentication
 */
export interface AuthError {
  user: null
  error: NextResponse
}

export type AuthResult = AuthSuccess | AuthError

/**
 * Require authentication for an API route
 *
 * This function handles:
 * - Creating Supabase client
 * - Getting user from session
 * - Returning consistent error responses
 *
 * @returns Object with user and error - check error first before using user
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const auth = await requireAuth()
 *   if (auth.error) return auth.error
 *
 *   // auth.user is guaranteed to be defined here
 *   const data = await fetchDataForUser(auth.user.id)
 *   return NextResponse.json({ data })
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: unauthorizedResponse(),
    }
  }

  return {
    user,
    error: null,
  }
}

/**
 * Get user's email from various sources
 * Prioritizes primary email, falls back to metadata
 *
 * @param user - Supabase user object
 * @returns Email string or undefined if not found
 */
export function getUserEmail(user: User): string | undefined {
  return (
    user.email ??
    (typeof user.user_metadata?.email === 'string'
      ? user.user_metadata.email
      : undefined)
  )
}

/**
 * Require authentication and email
 * Use when you need a guaranteed email (e.g., for profile creation)
 *
 * @returns Object with user, email, and error
 */
export async function requireAuthWithEmail(): Promise<
  | { user: User; email: string; error: null }
  | { user: null; email: null; error: NextResponse }
> {
  const auth = await requireAuth()
  if (auth.error) {
    return { user: null, email: null, error: auth.error }
  }

  const email = getUserEmail(auth.user)
  if (!email) {
    return {
      user: null,
      email: null,
      error: NextResponse.json(
        { error: 'User email missing', code: 'EMAIL_REQUIRED' },
        { status: 400 }
      ),
    }
  }

  return { user: auth.user, email, error: null }
}

