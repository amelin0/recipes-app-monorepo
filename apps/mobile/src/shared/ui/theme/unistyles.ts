import { StyleSheet } from 'react-native-unistyles';

import { colors } from './colors';
import { typography } from './typography';

const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  36: 144,
} as const;

const borderRadius = {
  default: 6,
  full: 999,
} as const;

export const lightTheme = {
  colors: colors,
  typography,
  spacing,
  borderRadius,
} as const;

export const darkTheme = {
  colors: colors,
  typography,
  spacing,
  borderRadius,
} as const;

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
  export interface UnistylesThemes extends AppThemes {}
}
