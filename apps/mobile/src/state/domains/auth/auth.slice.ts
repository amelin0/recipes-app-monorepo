import type { StateCreator } from 'zustand';

export interface AuthSlice {
  isAuthenticated: boolean;
  switchAuthenticatedAction: (authenticated: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  isAuthenticated: true,
  switchAuthenticatedAction: (isAuthenticated) => set(() => ({ isAuthenticated })),
});
