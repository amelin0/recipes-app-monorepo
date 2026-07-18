import { StyleSheet } from 'react-native-unistyles';

import { colors } from './colors';
import { iconSize, radius, shadow, spacing } from './sizes';
import { typography } from './typography';

export const lightTheme = {
    colors,
    typography,
    spacing,
    radius,
    shadow,
    iconSize,
} as const;

// Dark mode is not designed yet — mirrors light until dark Figma specs arrive.
export const darkTheme = lightTheme;

StyleSheet.configure({
    themes: {
        light: lightTheme,
        dark: darkTheme,
    },
    settings: {
        initialTheme: 'light',
    },
});

type AppThemes = {
    light: typeof lightTheme;
    dark: typeof darkTheme;
};

declare module 'react-native-unistyles' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- unistyles declaration-merging contract
    export interface UnistylesThemes extends AppThemes {}
}
