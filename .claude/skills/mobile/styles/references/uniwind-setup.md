---
title: Uniwind Pro Installation & Configuration
impact: CRITICAL
tags: uniwind-pro, setup, tailwind, metro, global-css, installation, typescript, safe-area
---

# Uniwind Pro Installation & Configuration

## Quick Config

```bash
# 1. Install (Uniwind Pro is a paid package, aliased as "uniwind")
yarn add uniwind@npm:uniwind-pro@rc tailwindcss

# 2. Create src/global.css
# 3. Patch metro.config.js (withUniwindConfig outermost)
# 4. Import global.css in app/_layout.tsx
```

> **Important:** Uniwind Pro is installed via npm alias — `"uniwind": "npm:uniwind-pro@rc"` in `package.json`. All imports use `uniwind` / `uniwind/metro` as usual.

## Prerequisites

- **Tailwind CSS 4** (v3 is NOT supported — no `tailwind.config.js`)
- Expo SDK with Metro bundler
- React Native project
- **Uniwind Pro license** (see [uniwind.dev/pricing](https://uniwind.dev/pricing))

## This Project's Setup

### global.css Location

`src/global.css` — imported in `src/app/_layout.tsx` as `import '../global.css'`

### metro.config.js

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
```

**Critical:** `withUniwindConfig` must be the **outermost** wrapper. Apply other Metro wrappers first, then wrap the result with `withUniwindConfig`.

### Configuration Options

| Option | Description | Required |
|--------|-------------|----------|
| `cssEntryFile` | Relative path to global.css | Yes |
| `dtsFile` | Path for auto-generated TypeScript types | No |
| `extraThemes` | Custom theme names beyond light/dark | No |
| `polyfills` | CSS unit adjustments (rem base) | No |
| `debug` | Enable warnings for unsupported CSS | No |

**Constraint:** Use relative paths only — no `path.resolve()` or absolute paths.

### global.css Entry Import

```typescript
// src/app/_layout.tsx
import '../global.css'; // Must be in layout component, NOT in index.ts

export default function RootLayout() {
  return ( /* ... */ );
}
```

**Do NOT import in root `index.ts`** — this breaks hot reload on CSS changes. Import in a layout component.

**Hot reload tip:** If CSS changes cause full app reloads instead of Fast Refresh, move the import deeper in the component tree (to a layout with fewer providers).

## global.css Structure

```css
@import 'tailwindcss';
@import 'uniwind';

@theme {
  /* Static tokens: fonts, spacing, radius, breakpoints */
  --font-figtree-regular: 'Figtree-Regular';
  --spacing-lg: 16px;
  --radius-md: 12px;
  --breakpoint-sm: 576px;
}

@layer theme {
  :root {
    @variant light {
      --color-bg-primary: #FFFFFF;
      --color-content-primary: #191B23;
    }
    @variant dark {
      --color-bg-primary: #0F1117;
      --color-content-primary: #F8F9FA;
    }
  }
}
```

### @theme — Static Tokens

Tokens that don't change between themes. Extends Tailwind's default utilities:

```css
@theme {
  /* Generates: font-figtree-regular, font-figtree-bold, etc. */
  --font-figtree-regular: 'Figtree-Regular';

  /* Generates: p-xxs, m-sm, gap-lg, etc. */
  --spacing-xxs: 2px;
  --spacing-lg: 16px;

  /* Generates: rounded-xs, rounded-full, etc. */
  --radius-xs: 4px;
  --radius-full: 9999px;

  /* Generates: sm:, md:, lg: breakpoint prefixes */
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
}
```

### @theme static — JS-Only Variables

For values accessed only via `useCSSVariable()`, not in classNames:

```css
@theme static {
  --chart-line-width: 2;
  --map-zoom-level: 15;
}
```

### @layer theme + @variant — Theme-Specific Colors

Colors that change between light/dark (or custom themes):

```css
@layer theme {
  :root {
    @variant light {
      --color-bg-primary: #FFFFFF;
      --color-content-primary: #191B23;
    }
    @variant dark {
      --color-bg-primary: #0F1117;
      --color-content-primary: #F8F9FA;
    }
  }
}
```

**Critical:** Every theme variant must define the same set of CSS variables. If you add a variable to one variant, add it to all.

## Safe Area Setup

Requires `react-native-safe-area-context` (already installed).

### 1. Create SafeAreaListener

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Uniwind from 'uniwind';
import { useEffect } from 'react';

function SafeAreaListener({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Uniwind.updateInsets(insets);
  }, [insets]);

  return <>{children}</>;
}
```

### 2. Wrap in Root Layout

```tsx
<SafeAreaProvider>
  <SafeAreaListener>
    {/* App content */}
  </SafeAreaListener>
</SafeAreaProvider>
```

### 3. Use Safe Area Classes

```tsx
<View className="pt-safe pb-safe px-4">
  <Text>Content respects safe area</Text>
</View>
```

## TypeScript Support

Add `dtsFile` to metro config for auto-generated types:

```javascript
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
```

Ensure it's included in `tsconfig.json`:

```json
{
  "include": ["**/*.ts", "**/*.tsx", "src/uniwind-types.d.ts"]
}
```

## Editor IntelliSense

For VS Code / Cursor Tailwind IntelliSense:

```json
{
  "tailwindCSS.classAttributes": [
    "className",
    "headerClassName",
    "contentContainerClassName",
    "containerClassName"
  ],
  "tailwindCSS.classFunctions": ["useResolveClassNames"]
}
```

## Custom Fonts (Expo)

1. Add fonts via `app.json` plugin:

```json
{
  "plugins": [
    ["expo-font", {
      "fonts": ["./assets/fonts/Figtree-Regular.ttf", "..."]
    }]
  ]
}
```

2. Define in global.css:

```css
@theme {
  --font-figtree-regular: 'Figtree-Regular';
  --font-figtree-bold: 'Figtree-Bold';
}
```

3. Use: `<Text className="font-figtree-bold text-lg">Bold text</Text>`

**Important:** Font family names must exactly match font filenames without extensions.

## Platform-Specific Fonts

```css
@layer theme {
  :root {
    --font-sans: 'Inter';

    @media ios {
      --font-sans: 'SF Pro Text';
    }
    @media android {
      --font-sans: 'Roboto';
    }
  }
}
```

**Note:** `@media ios/android/web` queries can only be used inside the `@theme` directive or `@layer theme` in global.css.

## Common Pitfalls

1. **Using Tailwind v3** — Uniwind Pro requires Tailwind 4. No `tailwind.config.js`
2. **Importing in index.ts** — Import `global.css` in layout component, not entry point
3. **Metro wrapper order** — `withUniwindConfig` must be outermost
4. **Missing prebuild** — Run `npx expo prebuild --clean` after changing metro.config.js
5. **global.css location** — Tailwind scans for classNames starting from this directory
6. **Mismatched @variant variables** — All theme variants must define the same CSS variables
7. **Restart Metro** — After modifying metro.config.js or global.css structure, restart with `--clear`
