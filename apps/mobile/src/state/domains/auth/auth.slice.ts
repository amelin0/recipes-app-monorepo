import type { StateCreator } from 'zustand';

export interface AuthSlice {
    isAuthenticated: boolean;
    switchAuthenticatedAction: (authenticated: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
    // DEV DEFAULT: true, щоб застосунок відкривався одразу на (tabs) під час
    // роботи над табами. TODO: повернути false + персистенцію, коли зʼявиться
    // реальний auth-флоу.
    isAuthenticated: true,
    switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),
});
