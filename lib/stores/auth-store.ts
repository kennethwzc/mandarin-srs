/**
 * Zustand store for authentication state
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { create } from 'zustand'

interface AuthState {
  user: { id: string; email: string; name?: string } | null
  isLoading: boolean
  setUser: (user: AuthState['user']) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
