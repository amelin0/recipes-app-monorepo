import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyAppTheme, createAppSlice, type AppSlice } from './domains/app';
import { createAuthSlice, type AuthSlice } from './domains/auth';

type AppStore = AppSlice &
    AuthSlice & {
        reset: () => void;
    };

const storage = createMMKV();

export const useStore = create<AppStore>()(
    persist(
        (...a) => ({
            ...createAppSlice(...a),
            ...createAuthSlice(...a),
            reset: () => {
                const [, get] = a;
                get().switchAuthenticatedAction(false);
            },
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => ({
                getItem: name => storage.getString(name) ?? null,
                setItem: (name, value) => storage.set(name, value),
                removeItem: name => storage.remove(name),
            })),
            partialize: state => ({
                appTheme: state.appTheme,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => state => {
                if (state) applyAppTheme(state.appTheme);
            },
        },
    ),
);
