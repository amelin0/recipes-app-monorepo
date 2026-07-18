import type { StateCreator } from 'zustand';

export interface AuthSlice {
    isAuthenticated: boolean;
    switchAuthenticatedAction: (authenticated: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
    // TODO: flip to false once the real auth flow ships — true keeps the app
    // on (tabs) while auth screens don't exist yet.
    isAuthenticated: true,
    switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),
});
