# Mobile 04 - Styling

## Stack

- **Uniwind Pro** (`uniwind@npm:uniwind-pro@latest`) — Tailwind CSS v4 bindings for React Native with a C++ engine
- **Tailwind CSS v4** (`tailwindcss@^4.0.0`) — utility-first CSS
- All styling via `className` prop — no `StyleSheet.create`

> Uniwind Pro is installed as an npm alias. All imports use `uniwind` / `uniwind/metro`, the alias resolves to the Pro package transparently.

## Setup

### Metro (`apps/mobile/metro.config.js`)

`withUniwindConfig` is the **outermost** Metro wrapper and points to `./src/global.css`. Auto-generated className types go to `./src/uniwind-types.d.ts`.

### Entry (`apps/mobile/src/App.tsx`)

`import './global.css'` at the very top of the root component file (not in `index.ts` — that breaks Fast Refresh).

### TypeScript (`apps/mobile/tsconfig.json`)

`src/uniwind-types.d.ts` is included so all utility classes are typed.

## Design Tokens (`apps/mobile/src/global.css`)

### Spacing

| Token | px | Token | px |
|---|---|---|---|
| `none` | 0 | `xl` | 24 |
| `xxs` | 4 | `2xl` | 28 |
| `xs` | 8 | `3xl` | 32 |
| `s` | 12 | `4xl` | 40 |
| `m` | 16 | `5xl` | 48 |
| `l` | 20 | `6xl` | 56 |
| | | `7xl` | 64 |

Used as `p-m`, `gap-l`, `mt-xs`, etc.

### Border Radius

Names mirror Figma `radius/` scale (pixel values).

| Class | Value | Figma |
|---|---|---|
| `rounded-none` | 0 | `radius/none` |
| `rounded-4` | 4 | `radius/4` |
| `rounded-8` | 8 | `radius/8` |
| `rounded-12` | 12 | `radius/12` |
| `rounded-16` | 16 | `radius/16` |
| `rounded-20` | 20 | `radius/20` |
| `rounded-24` | 24 | `radius/24` |
| `rounded-28` | 28 | `radius/28` |
| `rounded-32` | 32 | `radius/32` |
| `rounded-full` | 500 (fully rounded) | `radius/full` |

Used as `rounded-12`, `rounded-full`, etc.

### Border Width (Stroke)

Names mirror Figma `stroke/` scale (pixel values). `hairline` keeps its semantic name because CSS variables cannot contain a decimal (Figma label `0.5`).

| CSS var | Value | Figma |
|---|---|---|
| `--border-width-hairline` | 0.5px | `stroke/0.5` (device-hairline via `hairlineWidth()` on RN) |
| `--border-width-1` | 1px | `stroke/1` (default `border` utility) |
| `--border-width-2` | 2px | `stroke/2` |
| `--border-width-4` | 4px | `stroke/4` |
| `--border-width-8` | 8px | `stroke/8` |

Use plain `border` for 1px (default). Use `border-2` / `border-4` / `border-8` for thicker borders. For `0.5px` reach for `hairlineWidth()` via a custom `@utility h-hairline` helper in `global.css` when needed.

### Breakpoints

`sm`(576) `md`(768) `lg`(992)

### Color Tokens (Light + Dark)

All colors defined inside `@layer theme { :root { @variant light / @variant dark } }` — auto-switch on theme change. Values are a 1:1 mirror of the [Figma color/primitive page](https://www.figma.com/design/9DDLPnkTzHA1RXCWxrH9c2/11-AM-Version-1?node-id=84-11821). Light-mode hex is the source of truth; dark-mode values are sensible defaults until Figma ships a dark palette.

Brand is **pink-red** (`#E41B5E` solid) + **primary gradient** orange→pink (handled via `GradientView`, see below).

| Category (Figma scope) | Tokens | Light hex (key values) |
|---|---|---|
| **Primary** (Branding/primary) | `primary-default` `primary-active` `primary-on` `primary-subtle` `primary-on-subtle` `primary-link` | `#E41B5E` / `#B31549` / `#FFFFFF` |
| **Secondary** (Branding/secondary) | `secondary-default` `secondary-active` `secondary-on` | `#FFFFFF` / `#F2F2F7` / `#1E2932` |
| **Error** (Semantic/negative) | `error-default` `error-active` `error-subtle` `error-on` | `#FF0021` / `#C92339` |
| **Success** (Semantic/positive) | `success-default` `success-active` `success-subtle` `success-on` | `#00AB3C` / `#00832E` |
| **Warning** (Semantic/orange) | `warning-default` `warning-active` `warning-subtle` `warning-on` | `#FF8C40` / `#E97426` |
| **Info** | `info-default` `info-subtle` `info-on` | `#EAECF5` (placeholder, not in Figma) |
| **Content (text)** (Elements) | `content-primary` `content-secondary` `content-tertiary` `content-disabled` `content-inverse` `content-error` `content-link` `content-on-brand` `content-white` `content-black` | `#1E2932` / `#58616A` / `#687885` / `#BBBBBB` |
| **Background** | `bg-canvas` `bg-surface` `bg-elevated` `bg-block` `bg-overlay` `bg-inverse` | `#FFFFFF` / glass `rgba(255,255,255,0.6)` / dim `rgba(0,0,0,0.4)` |
| **Forms** | `form-border` `form-border-active` `form-bg-disabled` (+ aliases `border-default`, `border-form-focus`, `disabled-bg`) | `#E6E6E6` / `#F73656` / `#E0E2E4` |
| **Border (generic)** | `border-default` `border-subtle` `border-strong` `border-focus` `border-error` `border-form-focus` | — |
| **Divider** | `divider-primary` | `#E6E6E6` |
| **Icon** | `icon-default` `icon-secondary` `icon-inverse` | `#58616A` / `#687885` |
| **Disabled** | `disabled-bg` `disabled-content` `disabled-border` | `#E0E2E4` / `#BBBBBB` |

### Gradients (Figma: Branding/primary gradient, Active/primary, Background/screen)

Real gradients — cannot be expressed as a single CSS variable. Rendered via [`GradientView`](../../../apps/mobile/src/shared/ui/components/common/GradientView.tsx) (wraps `expo-linear-gradient`).

| `variant` | Figma origin | Stops |
|---|---|---|
| `brand-primary` | Branding/primary gradient | `#FF5537 → #F22469` @ 105.56° |
| `brand-active` | Active/primary gradient | `#FF826D → #FF548D` @ 105.56° |
| `screen` | Background/screen | `#F4FAFF → #FFF1FB` vertical |

Usage:

```tsx
import { StyleSheet } from 'react-native';
import { GradientView } from '@/shared/ui/components';

<Pressable className="rounded-m overflow-hidden">
  {({ pressed }) => (
    <>
      <GradientView
        variant={pressed ? 'brand-active' : 'brand-primary'}
        style={StyleSheet.absoluteFill}
      />
      <Text className="text-primary-on text-button-lg">Continue</Text>
    </>
  )}
</Pressable>
```

Never inline `<LinearGradient colors={[...]}>` with hardcoded hex values — always go through `GradientView` presets. New gradient? Add it to `GRADIENT_PRESETS` first.

### Typography Utilities

Custom `@utility` classes that bundle font-family, size, and line-height. Font family: **Inter** (wired via `expo-font` + `@theme` `--font-inter-*` variables). Line-heights follow the Figma design system:
- Display/large: 150%
- Display/medium: 140%
- Everything else: 130%

| Utility           | Size (px) | Line (px) | Weight    | Notes                       |
| ----------------- | --------- | --------- | --------- | --------------------------- |
| `text-display-lg` | 40        | 60        | Bold 700  | Hero headlines              |
| `text-display-md` | 32        | 45        | Bold 700  | Section hero                |
| `text-title-lg`   | 28        | 36        | SemiBold 600 | Screen title             |
| `text-title-md`   | 24        | 31        | SemiBold 600 | Section title            |
| `text-title-sm`   | 20        | 26        | SemiBold 600 | Subsection title         |
| `text-body-lg`    | 16        | 21        | Regular 400  | Primary body copy        |
| `text-body-md`    | 14        | 18        | SemiBold 600 | Emphasized body / form labels (Figma body/medium) |
| `text-body-sm`    | 14        | 18        | Regular 400  | Secondary body           |
| `text-caption`    | 12        | 16        | Regular 400  | Meta info, labels        |
| `text-overline`   | 10        | 13        | Medium 500   | Uppercase eyebrow labels |
| `text-button-lg`  | 14        | 18        | SemiBold 600 | Primary button text      |
| `text-button-sm`  | 14        | 18        | Medium 500   | Secondary button text    |
| `text-link`       | 14        | 18        | Medium 500   | Underlined inline link   |

**Always prefer the typography utility over raw combos** like `text-sm font-bold`. The utility bundles size, line-height, weight, family, and decoration in one class that matches Figma exactly.

## Usage

```tsx
<View className="flex-1 bg-bg-canvas px-m pt-safe">
  <Text className="text-title-md text-content-primary mb-s">Morning Workout</Text>
  <Text className="text-body-sm text-content-secondary">45 min · Strength</Text>

  <View className="bg-bg-surface rounded-l p-m border border-border-default mt-l">
    <Text className="text-body-md text-content-primary">Warmup</Text>
  </View>

  <Pressable className="bg-primary-default active:bg-primary-active rounded-m py-m mt-xl">
    <Text className="text-button text-primary-on text-center">Start</Text>
  </Pressable>
</View>
```

### Conditional classes

```tsx
<View className={`p-m rounded-m ${isActive ? 'bg-primary-default' : 'bg-bg-surface'}`}>
  <Text className={`text-button ${isActive ? 'text-primary-on' : 'text-content-primary'}`}>
    {label}
  </Text>
</View>
```

**Rule:** class names must be statically analyzable — `bg-${color}-500` won't compile.

### Platform variants

```tsx
<View className="ios:shadow-md android:elevation-4 native:p-m web:p-l" />
```

### Safe area

`pt-safe`, `pb-safe`, `p-safe`, `pt-safe-or-4`, `pb-safe-offset-4` (requires `SafeAreaListener` calling `Uniwind.updateInsets(insets)` — see styles skill for setup).

## Dark Mode

Automatic via `@variant light` / `@variant dark` in `global.css`. Components just reference semantic tokens (`bg-bg-canvas`, `text-content-primary`) — colors switch automatically with system theme.

To force a theme:
```typescript
import Uniwind from 'uniwind';
Uniwind.setTheme('dark');     // or 'light' or 'system'
```

## Rules

1. **`className` only** — never `StyleSheet.create` or inline `style={{}}` for layout/color/spacing/typography
2. **Semantic tokens** — `bg-bg-canvas` not `bg-white`, `text-content-primary` not `text-black`
3. **Typography utilities** — `text-title-md` instead of `text-2xl font-semibold`
4. **No dynamic class construction** — complete names in ternaries only
5. **Wrap third-party components** — use `withUniwind()` HOC at module level for components without native `className` support
6. **`style` prop only for runtime values** — Reanimated animated styles, gesture-driven values

## References

Full Uniwind Pro documentation lives in the styles skill:
- [.claude/skills/mobile/styles/SKILL.md](../../skills/mobile/styles/SKILL.md)
- [.claude/skills/mobile/styles/references/uniwind-setup.md](../../skills/mobile/styles/references/uniwind-setup.md)
- [.claude/skills/mobile/styles/references/uniwind-api.md](../../skills/mobile/styles/references/uniwind-api.md)
- [.claude/skills/mobile/styles/references/uniwind-theming.md](../../skills/mobile/styles/references/uniwind-theming.md)
- [.claude/skills/mobile/styles/references/uniwind-patterns.md](../../skills/mobile/styles/references/uniwind-patterns.md)
