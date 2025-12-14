/**
 * Authentication hook
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { useAuthStore } from '@/lib/stores/auth-store'

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore()

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    setLoading,
  }
}
