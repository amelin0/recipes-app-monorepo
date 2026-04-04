import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type AuthSlice, createAuthSlice } from './domains/auth/auth.slice';

type AppStore = AuthSlice & {
  reset: () => void;
};

export const useStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createAuthSlice(set, get, api),
      reset: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
