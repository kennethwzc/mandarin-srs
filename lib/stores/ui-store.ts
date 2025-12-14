/**
 * Zustand store for UI preferences
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: UIState['theme']) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
