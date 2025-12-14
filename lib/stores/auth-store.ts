/**
 * Zustand store for authentication state
 *
 * This store maintains the global auth state and syncs with Supabase.
 * It automatically initializes on mount and listens for auth changes.
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { useAuthStore } from '@/lib/stores/auth-store'
 *
 * export function MyComponent() {
 *   const { user, isLoading } = useAuthStore()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!user) return <div>Not logged in</div>
 *
 *   return <div>Welcome, {user.email}</div>
 * }
 * ```
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
  initialize: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // State
        user: null,
        session: null,
        isLoading: true,
        error: null,

        // Actions
        setUser: (user) => set({ user }),
        setSession: (session) => set({ session }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        clearAuth: () =>
          set({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          }),

        /**
         * Initialize auth state from Supabase
         * - Gets current session
         * - Sets up auth state listener
         * - Syncs state on auth changes
         */
        initialize: async () => {
          const supabase = createClient()

          try {
            // Get initial session
            const {
              data: { session },
            } = await supabase.auth.getSession()

            set({
              user: session?.user ?? null,
              session: session ?? null,
              isLoading: false,
            })

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
              set({
                user: session?.user ?? null,
                session: session ?? null,
                isLoading: false,
              })
            })

            // Note: Subscription cleanup is handled by Supabase client lifecycle
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize auth',
              isLoading: false,
            })
          }
        },
      }),
      {
        name: 'auth-storage',
        // Only persist non-sensitive data
        partialize: (state) => ({
          // Don't persist session (security risk)
          // Session is managed by Supabase cookies
          user: state.user
            ? {
                id: state.user.id,
                email: state.user.email,
              }
            : null,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)
