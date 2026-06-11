---
title: Uniwind Pro Theming & Dark Mode
impact: HIGH
tags: uniwind-pro, theming, dark-mode, custom-themes, css-variables, useUniwind, setTheme, updateCSSVariables
---

# Uniwind Pro Theming & Dark Mode

## Quick Pattern

```tsx
// PREFERRED — Semantic CSS variable tokens (auto-switch, no dark: needed)
<View className="bg-bg-primary">
  <Text className="text-content-primary">Auto theme-aware</Text>
</View>

// ACCEPTABLE — dark: variant for one-off overrides
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">Manual dark override</Text>
</View>

// NEVER — manual color switching with state
const [isDark, setIsDark] = useState(false);
<View style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
```

## Two Theming Approaches

### 1. CSS Variable Tokens (Recommended)

Define semantic color tokens in `global.css` that auto-switch per theme:

```css
@layer theme {
  :root {
    @variant light {
      --color-bg-primary: #FFFFFF;
      --color-content-primary: #191B23;
      --color-brand-primary: #0766FF;
    }
    @variant dark {
      --color-bg-primary: #0F1117;
      --color-content-primary: #F8F9FA;
      --color-brand-primary: #3B8AFF;
    }
  }
}
```

Components reference token names — no `dark:` prefix needed:

```tsx
<View className="bg-bg-primary">
  <Text className="text-content-primary">Automatically theme-aware</Text>
  <Pressable className="bg-brand-primary active:bg-brand-primary-pressed rounded-xl py-md">
    <Text className="text-button-primary-content text-center font-figtree-semibold">Action</Text>
  </Pressable>
</View>
```

**Advantages:** Scales to any number of themes, consistent across app, one place to change colors.

### 2. dark: Variant Prefix (For One-Offs)

Use for quick prototyping or styles that don't warrant a token:

```tsx
<View className="bg-white dark:bg-gray-950">
  <Text className="text-gray-900 dark:text-gray-100">Settings</Text>
  <View className="h-px bg-gray-200 dark:bg-gray-800" />
</View>
```

**Rule:** Every color class needs both base and `dark:` variant. Missing `dark:` means light value persists in dark mode.

**Variant nesting order:** `dark:active:bg-blue-600` — theme first, then state.

## Built-in Themes

| Theme | Behavior |
|-------|----------|
| `light` | Fixed light color scheme |
| `dark` | Fixed dark color scheme |
| `system` | Follows device settings (adaptive) |

Default: `system` with `adaptiveThemes: true`.

## Theme Switching API

```typescript
import Uniwind from 'uniwind';

// Switch themes
Uniwind.setTheme('dark');
Uniwind.setTheme('light');
Uniwind.setTheme('system');  // Re-enables adaptive themes

// Read current state
Uniwind.currentTheme;        // 'light' | 'dark' | 'system' | custom
Uniwind.hasAdaptiveThemes;   // true when theme is 'system'
```

**Important:** `Uniwind.setTheme('dark'/'light')` also calls `Appearance.setColorScheme()` internally, syncing native components (Alert, Modal, system dialogs).

## useUniwind() Hook

For components that need to react to theme changes in logic (not just styling):

```tsx
import { useUniwind } from 'uniwind';

function ThemeToggle() {
  const { theme, hasAdaptiveThemes } = useUniwind();

  return (
    <Pressable
      onPress={() => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        Uniwind.setTheme(next);
      }}
      className="p-3 rounded-lg bg-bg-secondary"
    >
      <Text className="text-content-primary font-figtree-medium">
        Theme: {theme}
      </Text>
    </Pressable>
  );
}
```

**Note:** "For most styling use cases, you don't need this hook. Use theme-based className variants instead."

## Custom Themes (Beyond Light/Dark)

### Step 1: Define CSS Variables

```css
@layer theme {
  :root {
    @variant light { /* ... */ }
    @variant dark { /* ... */ }

    @variant ocean {
      --color-bg-primary: oklch(0.25 0.05 220);
      --color-content-primary: oklch(0.95 0.01 220);
      --color-brand-primary: oklch(0.6 0.15 200);
      /* Must define ALL the same variables as light/dark */
    }

    @variant sunset {
      --color-bg-primary: #1a0a2e;
      --color-content-primary: #fef3c7;
      --color-brand-primary: #f59e0b;
    }
  }
}
```

### Step 2: Register in metro.config.js

```javascript
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  extraThemes: ['ocean', 'sunset'],
});
```

### Step 3: Activate

```tsx
Uniwind.setTheme('ocean');
```

**Important:** Restart Metro after adding `extraThemes`.

## updateCSSVariables()

Dynamically modify CSS variable values at runtime for a specific theme:

```typescript
Uniwind.updateCSSVariables(theme: string, variables: Record<string, string | number>): void
```

```tsx
// User picks accent color
Uniwind.updateCSSVariables('light', {
  '--color-brand-primary': '#ff6b6b',
  '--color-brand-primary-pressed': '#e85656',
});

// White-label branding
Uniwind.updateCSSVariables('light', {
  '--color-brand-primary': companyConfig.primaryColor,
});
```

**Behavior:**
- Changes persist per theme — switching themes preserves custom values
- Re-renders only trigger if modified theme is currently active
- Variable names must include `--` prefix
- Variables must be defined in `@variant` blocks or `@theme`

## useCSSVariable() — Access Tokens in JS

For third-party libraries that need color/spacing values:

```tsx
import { useCSSVariable } from 'uniwind';

function Chart() {
  const [lineColor, bgColor] = useCSSVariable([
    '--color-brand-primary',
    '--color-bg-primary',
  ]);

  return (
    <LineChart
      lineColor={lineColor}
      backgroundColor={bgColor}
      data={chartData}
    />
  );
}
```

## Persisting Theme Preference

Uniwind does not persist theme selection. Use MMKV or AsyncStorage:

```typescript
import Uniwind from 'uniwind';
import { storage } from '@/shared/services/storage.service';

const THEME_KEY = 'app_theme';

export async function loadSavedTheme() {
  const saved = storage.getString(THEME_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    Uniwind.setTheme(saved);
  }
}

export function saveTheme(theme: 'light' | 'dark' | 'system') {
  Uniwind.setTheme(theme);
  storage.set(THEME_KEY, theme);
}
```

Call `loadSavedTheme()` in root layout `useEffect`.

## This Project's Token Map

All tokens defined in `src/global.css`:

| Category | Token Example | Light | Dark |
|----------|--------------|-------|------|
| Background | `bg-bg-primary` | #FFFFFF | #0F1117 |
| Content | `text-content-primary` | #191B23 | #F8F9FA |
| Brand | `bg-brand-primary` | #0766FF | #3B8AFF |
| Status | `text-error` | #D02512 | #F87171 |
| Button | `bg-button-primary` | #000000 | #FFFFFF |
| Field | `bg-field-bg` | #FFFFFF | #1A1C25 |
| Divider | `bg-divider` | #E3E4E6 | #2A2D35 |
| Icon | `text-icon-default` | #8F8F8F | #6B6D77 |

## Common Pitfalls

1. **Missing dark: counterparts** — If using `dark:` approach, pair every color with its dark variant
2. **Hardcoding colors** — Use semantic tokens (`bg-bg-primary`) not raw colors (`bg-white`)
3. **Not persisting theme** — `Uniwind.setTheme()` resets on app restart. Use MMKV/AsyncStorage to persist
4. **Tailwind v3 syntax** — No `darkMode: 'class'`. Use Tailwind 4 `@variant dark`
5. **Variant nesting order** — `dark:active:bg-blue-600` (theme first, state second)
6. **Mismatched variables** — All `@variant` blocks must define the same CSS variable set
7. **extraThemes not registered** — Custom themes need `extraThemes` in metro.config.js
