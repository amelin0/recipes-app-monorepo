---
name: icons
description: Icon rendering for the DNS mobile app using react-native-nano-icons. SVGs are compiled to a font + glyphmap at prebuild; at runtime, icons render as native glyph stacks (no react-native-svg, no per-icon React subtree).
---

# Icons Skill — react-native-nano-icons

## Why nano-icons

- **Performance**: one `drawGlyphs` call per layer via CoreText (iOS) / Canvas (Android). Zero React subtree per icon, zero Yoga layout. ~10–50× faster than `react-native-svg` in dense lists.
- **Typed**: icon names come from the generated glyphmap — TypeScript catches typos at compile time.
- **Multicolor**: each distinct fill in the SVG becomes a separate layer; recolor per-layer at runtime.
- **Zero manual font linking**: the Expo config plugin hooks into `prebuild` and wires the `.ttf` into native projects.

## CRITICAL: Icon Rules

1. **Always use `AppIcon`** — never `<Svg>` / `<Path>` from `react-native-svg` for icons, never PNG/image-based icons.
2. **Drop SVGs into `apps/mobile/assets/icons/app/`** — filename = icon name (`heart.svg` → `<AppIcon name="heart" />`).
3. **Regenerate after every SVG change** — `pnpm --filter @dns/mobile prebuild`. The plugin writes `.ttf` + `.glyphmap.json` under `assets/icons/nanoicons/app-icons.*`. Commit both the SVG and the generated artifacts.
4. **Use design-token colors** — `color={tokens.primary}`. Never inline `#hex`. `useCSSVariable('--color-primary-default')` returns the resolved token value at runtime.
5. **Size in points, never px in raw styles** — `size={24}` prop, not `style={{ width: 24 }}`. nano-icons renders as text glyphs so size = font size.
6. **SVG constraints**: no `<filter>` / `<mask>` (unsupported). Only `*.svg` input. Use 24×24 canvas (`viewBox="0 0 24 24"`).

## Setup (already wired)

### `app.json`

```json
{
  "expo": {
    "plugins": [
      ["react-native-nano-icons", {
        "iconSets": [
          { "inputDir": "./assets/icons/app", "fontFamily": "app-icons" }
        ]
      }]
    ]
  }
}
```

### Folder layout

```
apps/mobile/assets/icons/
├── app/                        # ← drop SVGs here
│   ├── placeholder.svg
│   ├── heart.svg
│   └── README.md               # author notes
└── nanoicons/                  # ← generated, commit these
    ├── app-icons.ttf
    └── app-icons.glyphmap.json
```

## Adding a new icon

1. Export the SVG from Figma with fills (no filters/masks). Keep it 24×24.
2. Save it to `apps/mobile/assets/icons/app/{icon-name}.svg` (kebab-case filename).
3. Run `pnpm --filter @dns/mobile prebuild` — regenerates font + glyphmap.
4. Reinstall/rebuild the native app (`pnpm --filter @dns/mobile ios` / `android`) if running.
5. Use: `<AppIcon name="icon-name" size={24} color={token} />` — `name` is now typed.

## Reference — AppIcon wrapper

After the first prebuild generates `app-icons.glyphmap.json`, create the wrapper at `src/shared/ui/components/icon/AppIcon.tsx`:

```tsx
import { createNanoIconSet } from 'react-native-nano-icons';
import glyphMap from '../../../../../assets/icons/nanoicons/app-icons.glyphmap.json';

export const AppIcon = createNanoIconSet(glyphMap);
export type AppIconName = keyof typeof glyphMap;
```

Barrel at `src/shared/ui/components/icon/index.ts`:

```ts
export { AppIcon, type AppIconName } from './AppIcon';
```

Usage:

```tsx
import { AppIcon } from '@/shared/ui/components';
import { useCSSVariable } from 'uniwind';

function Favorite({ active }: { active: boolean }) {
  const [primary, tertiary] = useCSSVariable([
    '--color-primary-default',
    '--color-content-tertiary',
  ]);
  return <AppIcon name="heart" size={24} color={active ? primary : tertiary} />;
}
```

## Multicolor icons

Pass a color array — each entry targets one layer (by distinct fill in the source SVG). Shorter arrays repeat the last color.

```tsx
<AppIcon name="flag-us" size={32} color={['#FFFFFF', '#B22234', '#3C3B6E']} />
```

## Anti-patterns

- `import { Svg, Path } from 'react-native-svg'` to render an icon — banned. Use nano-icons.
- Inline SVG strings or `<SVGCode/>` components — banned. Icons live as files in `assets/icons/app/`.
- Using PNGs for icons — ~10× larger, no color theming, blurry at high DPI.
- Hardcoded hex in `color={...}` — must be a design token (`useCSSVariable`) or preset.
- Mixing icon libraries (`@expo/vector-icons`, `react-native-vector-icons`) — pick one, and it's nano-icons for this project.

## Expo Go caveat

In Expo Go the native renderer falls back to `<Text>` using the generated font. You need to load the `.ttf` via `expo-font` at startup for Expo Go preview to work. On a dev build (recommended for this project), the native implementation kicks in automatically and no manual font loading is needed.

## References

- Library: [software-mansion-labs/react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
- Blog: [You might not need react-native-svg](https://swmansion.com/blog/you-might-not-need-react-native-svg-b5c65646d01f)
- Our icons folder: [`apps/mobile/assets/icons/app/README.md`](../../../../apps/mobile/assets/icons/app/README.md)
