import type { StateCreator } from 'zustand';

export interface AuthSlice {
    isAuthenticated: boolean;
    switchAuthenticatedAction: (authenticated: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
    // Кожен запуск починається з онбордингу/входу; «Увійти» та код з пошти
    // вмикають гард на час сесії. TODO: персистенція разом із реальним
    // auth-флоу (токени в SecureStore).
    isAuthenticated: false,
    switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),
});
