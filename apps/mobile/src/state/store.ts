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
            // DEV: isAuthenticated тимчасово НЕ персиститься, щоб dev-дефолт
            // `true` діяв на кожному запуску. TODO: повернути в partialize
            // разом з реальним auth-флоу.
            partialize: state => ({
                appTheme: state.appTheme,
            }),
            version: 1,
            migrate: persisted => {
                // v0 персистив isAuthenticated — прибираємо, щоб старий
                // збережений `false` не перекривав dev-дефолт.
                const { isAuthenticated: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown>;
                return rest;
            },
            onRehydrateStorage: () => state => {
                if (state) applyAppTheme(state.appTheme);
            },
        },
    ),
);
