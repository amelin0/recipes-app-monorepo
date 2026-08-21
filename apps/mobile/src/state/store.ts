import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyAppTheme, createAppSlice, UNIT_DEFAULTS, type AppSlice } from './domains/app';
import { createAuthSlice, type AuthSlice } from './domains/auth';
import { createMealPlanSlice, type MealPlanSlice } from './domains/meal-plan';
import { createProfileSetupSlice, PROFILE_SETUP_DEFAULTS, type ProfileSetupSlice } from './domains/profile-setup';
import { createRecipeFiltersSlice, type RecipeFiltersSlice } from './domains/recipe';
import { createShoppingListSlice, type ShoppingListSlice } from './domains/shopping-list';

type AppStore = AppSlice &
    AuthSlice &
    MealPlanSlice &
    ProfileSetupSlice &
    RecipeFiltersSlice &
    ShoppingListSlice & {
        reset: () => void;
    };

const storage = createMMKV();

export const useStore = create<AppStore>()(
    persist(
        (...a) => ({
            ...createAppSlice(...a),
            ...createAuthSlice(...a),
            ...createMealPlanSlice(...a),
            ...createProfileSetupSlice(...a),
            ...createRecipeFiltersSlice(...a),
            ...createShoppingListSlice(...a),
            reset: () => {
                const [, get] = a;
                get().switchAuthenticatedAction(false);
                get().resetProfileSetup();
                get().resetRecipeFilters();
                get().resetPlanWeek();
                get().resetShoppingList();
            },
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => ({
                getItem: name => storage.getString(name) ?? null,
                setItem: (name, value) => storage.set(name, value),
                removeItem: name => storage.remove(name),
            })),
            // isAuthenticated навмисно НЕ персиститься: до реального auth-флоу
            // сесія живе лише в памʼяті, і кожен запуск проходить вхід заново.
            // TODO: повернути в partialize разом з токенами.
            partialize: state => ({
                appTheme: state.appTheme,
                units: state.units,
                // Answers survive a kill so the questionnaire resumes (FR-005).
                profileSetup: state.profileSetup,
            }),
            version: 1,
            migrate: persisted => {
                // v0 персистив isAuthenticated — прибираємо, щоб старе
                // збережене значення не перекривало сесійний дефолт.
                const { isAuthenticated: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown>;
                return rest;
            },
            // zustand replaces persisted keys wholesale, so a build that adds a
            // questionnaire answer would read `undefined` for it out of an older
            // store. Merge the defaults back under whatever was saved.
            merge: (persisted, current) => {
                const saved = (persisted ?? {}) as Partial<AppStore>;
                return {
                    ...current,
                    ...saved,
                    units: { ...UNIT_DEFAULTS, ...saved.units },
                    profileSetup: { ...PROFILE_SETUP_DEFAULTS, ...saved.profileSetup },
                };
            },
            onRehydrateStorage: () => state => {
                if (state) applyAppTheme(state.appTheme);
            },
        },
    ),
);
