---
name: styles
description: Styling patterns using React Native Unistyles 3. Covers theme setup, breakpoints, responsive styles, dynamic variants, and design tokens.
---

# Styles Skill — Unistyles 3

## Purpose

Defines styling patterns using React Native Unistyles 3 — a universal styling solution with compile-time optimizations, theming, and responsive breakpoints.

---

## Setup

### Installation

```bash
npx expo install react-native-unistyles
```

### Theme Definition

```typescript
// src/shared/styles/theme.ts
export const lightTheme = {
  colors: {
    olive50: '#F5F5F0',
    olive100: '#E8E8DC',
    olive200: '#D4D4C4',
    olive400: '#8B9A6B',
    olive600: '#6B7A4B',
    olive800: '#4A5A2B',
    peach50: '#FFF5F0',
    peach100: '#FFE8DC',
    peach200: '#FFD4C0',
    peach400: '#D4956A',
    peach600: '#B4754A',
    peach800: '#8A5530',
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F5F5',
    gray200: '#E5E5E5',
    gray400: '#999999',
    gray600: '#666666',
    gray800: '#333333',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    heading: {
      fontFamily: 'Manrope',
    },
    body: {
      fontFamily: 'Inter',
    },
  },
} as const

export type AppTheme = typeof lightTheme
```

### Unistyles Configuration

```typescript
// src/shared/styles/unistyles.ts
import { UnistylesRegistry } from 'react-native-unistyles'
import { lightTheme } from './theme'

type AppBreakpoints = typeof breakpoints

const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
} as const

UnistylesRegistry
  .addBreakpoints(breakpoints)
  .addThemes({
    light: lightTheme,
  })
  .addConfig({
    initialTheme: 'light',
  })

declare module 'react-native-unistyles' {
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  export interface UnistylesThemes {
    light: typeof lightTheme
  }
}
```

### Entry Point

```typescript
// src/app/_layout.tsx
import '../shared/styles/unistyles' // Must be imported before any component
```

---

## Stylesheet Pattern

```typescript
// src/view/recipes/recipes-list/RecipesListScreen.tsx
import { View, Text } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'

export const RecipesListScreen = () => {
  const { styles } = useStyles(stylesheet)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
    </View>
  )
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: theme.typography.heading.fontFamily,
    color: theme.colors.olive800,
  },
}))
```

---

## Dynamic Styles (variants)

```typescript
const stylesheet = createStyleSheet(theme => ({
  button: (variant: 'primary' | 'secondary') => ({
    backgroundColor: variant === 'primary' ? theme.colors.olive600 : theme.colors.white,
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: theme.colors.olive600,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  }),
  buttonText: (variant: 'primary' | 'secondary') => ({
    color: variant === 'primary' ? theme.colors.white : theme.colors.olive600,
    fontFamily: theme.typography.body.fontFamily,
    fontWeight: '600' as const,
  }),
}))

// Usage
<Pressable style={styles.button('primary')}>
  <Text style={styles.buttonText('primary')}>Add to Plan</Text>
</Pressable>
```

---

## Responsive Styles (breakpoints)

```typescript
const stylesheet = createStyleSheet(theme => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  card: {
    width: {
      xs: '100%',
      sm: '48%',
      md: '31%',
    },
  },
}))
```

---

## Rules

1. **Always use `createStyleSheet`** — never inline styles or `StyleSheet.create`
2. **Access theme via callback** — `createStyleSheet(theme => ({...}))`, not hardcoded values
3. **Co-locate styles** — stylesheet at the bottom of the component file
4. **Use theme tokens** — colors, spacing, radius from theme, not magic numbers
5. **Dynamic styles via functions** — `style: (variant) => ({...})`, not conditional objects
6. **Import unistyles config once** — in root `_layout.tsx`

---

## File Structure

```
shared/styles/
├── theme.ts           # Theme tokens (colors, spacing, radius, typography)
├── unistyles.ts       # Registry config (breakpoints, themes)
└── index.ts           # Barrel export
```
