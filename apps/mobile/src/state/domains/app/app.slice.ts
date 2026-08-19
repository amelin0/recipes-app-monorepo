import { UnistylesRuntime } from 'react-native-unistyles';
import type { StateCreator } from 'zustand';

export type AppTheme = 'Light' | 'Dark' | 'System';

/** Quantities the user can switch between metric and imperial (804:24715). */
export type UnitQuantity = 'bodyMass' | 'foodWeight' | 'length' | 'water';
export type UnitPreference = 'metric' | 'imperial';
export type UnitPreferences = Record<UnitQuantity, UnitPreference>;

/**
 * App-wide UI state (theme, etc.) that should survive restarts. Persisted via
 * the root store's `persist` middleware — keep `appTheme` in `partialize` in
 * `state/store.ts` so MMKV holds it across launches.
 */
export interface AppSlice {
    appTheme: AppTheme;
    setAppTheme: (theme: AppTheme) => void;
    units: UnitPreferences;
    setUnitPreference: (quantity: UnitQuantity, preference: UnitPreference) => void;
}

const initialAppTheme: AppTheme = 'Light';

export const UNIT_QUANTITIES: UnitQuantity[] = ['bodyMass', 'foodWeight', 'length', 'water'];

export const UNIT_DEFAULTS: UnitPreferences = {
    bodyMass: 'metric',
    foodWeight: 'metric',
    length: 'metric',
    water: 'metric',
};

/**
 * Map our literal to the lowercase theme name Unistyles expects. `System` has
 * no fixed answer — adaptive themes resolve it — so it is not accepted here.
 */
export const toUnistylesTheme = (theme: Exclude<AppTheme, 'System'>): 'light' | 'dark' =>
    theme === 'Dark' ? 'dark' : 'light';

/**
 * Apply the persisted theme to Unistyles — on user toggle and on initial
 * hydration. `System` hands the choice back to the OS via adaptive themes;
 * the explicit options pin it.
 */
export const applyAppTheme = (theme: AppTheme): void => {
    if (theme === 'System') {
        UnistylesRuntime.setAdaptiveThemes(true);
        return;
    }

    UnistylesRuntime.setAdaptiveThemes(false);
    UnistylesRuntime.setTheme(toUnistylesTheme(theme));
};

export const createAppSlice: StateCreator<AppSlice, [], [], AppSlice> = set => ({
    appTheme: initialAppTheme,

    setAppTheme: appTheme => {
        applyAppTheme(appTheme);
        set({ appTheme });
    },

    units: UNIT_DEFAULTS,

    setUnitPreference: (quantity, preference) => set(state => ({ units: { ...state.units, [quantity]: preference } })),
});
