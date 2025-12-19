/**
 * Simplified user authentication for Server Components
 *
 * This module provides a lightweight way to get the authenticated user
 * in Server Components, trusting that middleware has already validated
 * the session.
 *
 * Why this approach?
 * - Middleware already validates auth on every protected route
 * - Double-checking auth in each page causes race conditions during navigation
 * - This reduces Supabase API calls and improves stability
 *
 * Safety net:
 * - If somehow the user is not authenticated, return null
 * - Pages should handle null gracefully with a redirect or minimal UI
 */

import { createClient } from './server'
import { isAbortedError } from '@/lib/utils/request-helpers'

/**
 * Get the authenticated user for a Server Component
 *
 * This function trusts that middleware has validated the session.
 * It makes a single getUser() call but handles aborted requests gracefully.
 *
 * @returns User object or null if not authenticated or request was aborted
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const user = await getAuthenticatedUser()
 *   if (!user) {
 *     redirect('/login')
 *   }
 *   // ... rest of page
 * }
 * ```
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    // If request was aborted (user navigated away), return null silently
    if (isAbortedError(error)) {
      return null
    }

    // For other errors, also return null - page will handle gracefully
    // This prevents error boundaries from triggering on transient issues
    return null
  }
}

/**
 * Get user ID only (for cases where you just need the ID)
 *
 * @returns User ID or null
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser()
  return user?.id ?? null
}
