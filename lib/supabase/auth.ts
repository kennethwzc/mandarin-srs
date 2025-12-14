/**
 * Authentication helper functions
 *
 * Client-side authentication utilities for signup, login, logout, etc.
 * These functions use the Supabase client to manage user sessions.
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * Sign up a new user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @param metadata - Optional user metadata (username, timezone, etc.)
 * @returns User object or error
 *
 * @example
 * ```tsx
 * const { user, error } = await signUp('user@example.com', 'password123', {
 *   username: 'johndoe',
 *   timezone: 'America/New_York'
 * })
 * ```
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    username?: string
    timezone?: string
  }
) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return { user: null, error: error.message }
  }

  return { user: data.user, error: null }
}

/**
 * Sign in an existing user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Session object or error
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { session: null, error: error.message }
  }

  return { session: data.session, error: null }
}

/**
 * Sign out the current user
 * Clears session and redirects to home page
 */
export async function signOut() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  // Redirect to home page after signout
  window.location.href = '/'
  return { error: null }
}

/**
 * Send password reset email
 *
 * @param email - User's email address
 * @returns Success or error message
 */
export async function resetPassword(email: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Update user password (requires current session)
 *
 * @param newPassword - New password
 * @returns Success or error message
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Get current session (client-side)
 *
 * @returns Session object or null
 */
export async function getSession() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/**
 * Get current user (client-side)
 *
 * @returns User object or null
 */
export async function getUser() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Get current user (server-side)
 * For use in Server Components and API routes
 *
 * @returns User object or null
 */
export async function getServerUser() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Refresh the current session
 * Useful for long-lived sessions
 */
export async function refreshSession() {
  const supabase = createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession()

  if (error) {
    return { session: null, error: error.message }
  }

  return { session, error: null }
}
