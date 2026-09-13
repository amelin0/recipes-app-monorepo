import type { StateCreator } from 'zustand';

export interface AuthSlice {
    isAuthenticated: boolean;
    /**
     * Whether the launch-time SecureStore read has finished. The router waits
     * on it: routing off `isAuthenticated` while it is still `false` would
     * bounce a signed-in user through the sign-in screen for one frame.
     */
    isSessionRestored: boolean;
    switchAuthenticatedAction: (authenticated: boolean) => void;
    markSessionRestoredAction: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
    // Джерело істини — токени в SecureStore, не персист зустанда: інакше після
    // «Вийти» на іншому пристрої прапорець лишався б увімкнений. На старті
    // `useRestoreSession` читає сховище і піднімає це значення.
    isAuthenticated: false,
    isSessionRestored: false,
    switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),
    markSessionRestoredAction: () => set(() => ({ isSessionRestored: true })),
});
