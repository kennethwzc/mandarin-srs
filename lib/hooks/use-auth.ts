/**
 * Custom hook for authentication
 *
 * Provides access to auth state and auth functions.
 * Automatically initializes auth state on mount.
 *
 * @returns Auth state and functions
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * export function LoginForm() {
 *   const { user, isLoading, signIn } = useAuth()
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault()
 *     const { error } = await signIn(email, password)
 *     if (error) {
 *       alert(error)
 *     }
 *   }
 * }
 * ```
 */

'use client'

import { useEffect } from 'react'

import { useAuthStore } from '@/lib/stores/auth-store'
import * as authUtils from '@/lib/supabase/auth'

export function useAuth() {
  const { user, session, isLoading, error, initialize } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    // State
    user,
    session,
    isLoading,
    error,
    isAuthenticated: !!user,

    // Auth functions
    signUp: authUtils.signUp,
    signIn: authUtils.signIn,
    signOut: authUtils.signOut,
    resetPassword: authUtils.resetPassword,
    updatePassword: authUtils.updatePassword,
    refreshSession: authUtils.refreshSession,
  }
}
