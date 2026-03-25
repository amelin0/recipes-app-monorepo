'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AuthSlice, createAuthSlice } from './domains/auth/auth.slice'

type AppStore = AuthSlice & { reset: () => void }

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...((set) => ({
        reset: () =>
          set({
            isAuthenticated: false,
          }),
      }))(a[0]),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export const resetStore = () => {
  useStore.getState().reset()
}
