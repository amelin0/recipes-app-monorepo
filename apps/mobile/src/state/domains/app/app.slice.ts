import { UnistylesRuntime } from 'react-native-unistyles';
import type { StateCreator } from 'zustand';

export type AppTheme = 'Light' | 'Dark';

/**
 * App-wide UI state (theme, etc.) that should survive restarts. Persisted via
 * the root store's `persist` middleware — keep `appTheme` in `partialize` in
 * `state/store.ts` so MMKV holds it across launches.
 */
export interface AppSlice {
    appTheme: AppTheme;
    setAppTheme: (theme: AppTheme) => void;
}

const initialAppTheme: AppTheme = 'Light';

/** Map our `'Light' | 'Dark'` literal to the lowercase theme name Unistyles expects. */
export const toUnistylesTheme = (theme: AppTheme): 'light' | 'dark' => (theme === 'Dark' ? 'dark' : 'light');

/** Apply the persisted theme to Unistyles — on user toggle and on initial hydration. */
export const applyAppTheme = (theme: AppTheme): void => {
    UnistylesRuntime.setTheme(toUnistylesTheme(theme));
};

export const createAppSlice: StateCreator<AppSlice, [], [], AppSlice> = set => ({
    appTheme: initialAppTheme,

    setAppTheme: appTheme => {
        applyAppTheme(appTheme);
        set({ appTheme });
    },
});
