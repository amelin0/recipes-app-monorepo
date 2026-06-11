---
name: styles
description: Styling patterns for the DNS mobile app using Uniwind Pro (Tailwind CSS v4 bindings). Covers className prop, theme configuration, responsive design, platform variants, data selectors, CSS functions, and component patterns.
license: MIT
metadata:
  author: DNS
  tags: styling, uniwind, tailwind, themes, responsive, breakpoints, dark-mode, platform-variants, data-selectors, css-functions
---

# Styles — Uniwind Pro

## Overview

The DNS mobile app uses **Uniwind Pro** — Tailwind CSS v4 utility classes compiled at build time via a Metro plugin. Every React Native component gets a `className` prop out of the box. Themes (light/dark/custom) are defined in CSS with `@variant`.

> **Note:** Uniwind Pro is installed as an npm alias: `"uniwind": "npm:uniwind-pro@latest"` in `apps/mobile/package.json`. All imports use `uniwind` / `uniwind/metro` — the alias resolves to the Pro package transparently.

## CRITICAL: Styling Rules

1. **ALWAYS use `className`** — never use `StyleSheet.create()`. Inline `style={{}}` is permitted **only** for the explicit exceptions below (shadows, gradients, animations, runtime-computed values). Anything Uniwind can express — spacing, radius, color, layout, typography, safe-area, platform variants — must use `className`
2. **ALWAYS use design tokens — zero hardcoded values** — every color, spacing, radius, border width, and font size **must** come from a token defined in `apps/mobile/src/global.css`. If a token doesn't exist, add it to `global.css` first. Never use `bg-white`, `p-4`, `rounded-lg`, `text-xl`, `#ff6b00`, `fontSize: 16`, etc. directly in code.
3. **ALWAYS use typography utilities** — use `text-title-md`, `text-body-sm`, `text-button-lg`, etc. Never compose raw Tailwind like `text-xl font-bold leading-tight` — that bypasses the design system and drifts from Figma.
4. **Use semantic tokens for theming** — prefer tokens that auto-switch via `@variant light` / `@variant dark` (e.g. `bg-bg-canvas`, `text-content-primary`). Use `dark:` prefix only for one-off overrides or prototyping
5. **Use platform selectors** — `ios:`, `android:`, `web:`, `native:` instead of `Platform.select()`
6. **Use responsive breakpoints** — `sm:`, `md:`, `lg:` with mobile-first design
7. **Wrap third-party components** — use `withUniwind()` HOC at module level for components without native `className` support
8. **Never dynamically construct class names** — `bg-${color}-500` won't compile. Use complete class names in ternaries
9. **Never mix `style` and `className`** on the same component — pick one approach. `style` only for truly dynamic runtime values (animations, API-driven data)

### Token Coverage (what must never be hardcoded)

| Category     | ❌ Forbidden                                          | ✅ Required                                     |
| ------------ | ----------------------------------------------------- | ----------------------------------------------- |
| Colors       | `bg-white`, `text-black`, `#ff6b00`, `rgb(...)`       | `bg-bg-canvas`, `text-content-primary`, `bg-primary-default` |
| Spacing      | `p-4`, `m-2`, `gap-6`, `padding: 16`                  | `p-m`, `m-xs`, `gap-xl`                         |
| Radius       | `rounded-lg`, `rounded-2xl`, `borderRadius: 12`       | `rounded-12`, `rounded-16`, `rounded-full`      |
| Border width | `border-2`, `borderWidth: 1`                          | custom `border-width-*` utilities from `@theme` |
| Font size    | `text-xl`, `text-sm`, `fontSize: 16`                  | `text-title-md`, `text-body-lg`                 |
| Font weight  | `font-bold`, `font-medium` (standalone)               | bundled inside typography utility               |
| Line height  | `leading-tight`, `lineHeight: 20`                     | bundled inside typography utility               |

### Missing token? Add it — don't inline

If the design needs a spacing of 72px that's not in `--spacing-*`, add `--spacing-8xl: 72px` to `global.css` `@theme {}` first, then use `p-8xl`. Same rule for every other axis (color, radius, typography). This keeps the design system the single source of truth.

## When to Use `style` Prop (Exceptions)

Inline `style={{}}` is the **only** way to do these — Uniwind has no first-class equivalent yet:

- **Shadows** — `style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}` (CSS box-shadow string syntax; replaces legacy `shadowColor`/`shadowOffset` and Android `elevation`)
- **Gradients** — `style={{ experimental_backgroundImage: 'linear-gradient(to bottom, #000, #fff)' }}` (native CSS gradient; preferred over `expo-linear-gradient` for simple cases — keep `GradientView` for the Figma brand presets)

It's also the right tool for runtime-only values:

- Reanimated animated styles (`useAnimatedStyle`)
- Values computed from gestures / sensors at runtime
- Third-party libraries that require style objects and can't be wrapped with `withUniwind`

**Everything else stays in `className`.** If you find yourself writing `style={{ padding: 16, gap: 8, borderRadius: 12 }}`, you're going around Uniwind. Convert to `p-m gap-xs rounded-12`.

## Conflicts with user-level skills

If `vercel-react-native-skills:ui-styling` is loaded into context (it ships rules for `borderCurve`, `gap`-on-parent, `boxShadow`, font-size hierarchy, etc.), apply this filter:

| Their suggestion | Adopt? | Why |
|---|---|---|
| `boxShadow: '0 2px 8px ...'` (CSS string) | **Yes** — matches the shadow exception above | We have no shadow Uniwind utility |
| `experimental_backgroundImage: 'linear-gradient(...)'` | **Yes** — matches the gradient exception | Same |
| `borderCurve: 'continuous'` paired with `borderRadius` | **Conditional** — pair via `style` only when you already need inline `style` for shadow/gradient on the same element. Otherwise stay with `rounded-N` className | Uniwind currently has no `borderCurve` utility |
| `style={{ gap: 8 }}` instead of margin | **No** — use `gap-xs` className | We have spacing tokens |
| `style={{ padding: 16 }}` | **No** — use `p-m` className | Same |
| Inline `fontSize` / `fontWeight` for hierarchy | **No** — use `text-title-md` / `text-body-sm` etc. | Typography utilities are mandatory |
| Inline color literals | **No** — use semantic Uniwind tokens (`text-content-primary`, etc.) | Theme tokens drive light/dark switching |

## Quick Reference

```tsx
// Basic component with Uniwind
<View className="flex-1 bg-bg-canvas p-l">
  <Text className="text-title-md text-content-primary">Title</Text>
  <Text className="text-body-sm text-content-secondary mt-xs">Subtitle</Text>
  <Pressable className="bg-primary-default active:bg-primary-active rounded-12 py-m mt-l">
    <Text className="text-button-lg text-primary-on text-center">Action</Text>
  </Pressable>
</View>

// Platform-specific
<View className="ios:shadow-md android:elevation-4 native:p-m web:p-l" />

// Responsive
<View className="p-s sm:p-m lg:p-xl" />

// Data selectors (v1.3.0+)
<View data-active={isActive} className="bg-bg-surface data-[active=true]:bg-primary-default" />

// Third-party wrapping
const StyledBlurView = withUniwind(BlurView)
<StyledBlurView className="flex-1 rounded-16" />
```

## Priority-Ordered Guidelines

| Priority | Category                     | Impact   | Reference                                        |
| -------- | ---------------------------- | -------- | ------------------------------------------------ |
| 1        | Setup & Configuration        | CRITICAL | [uniwind-setup.md](references/uniwind-setup.md)  |
| 2        | Core API & Utility Classes   | CRITICAL | [uniwind-api.md](references/uniwind-api.md)      |
| 3        | Theming & Dark Mode          | HIGH     | [uniwind-theming.md](references/uniwind-theming.md) |
| 4        | Patterns & Best Practices    | HIGH     | [uniwind-patterns.md](references/uniwind-patterns.md) |

## References

| File                                              | Impact   | Description                                                                                                          |
| ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| [uniwind-setup.md](references/uniwind-setup.md)   | CRITICAL | Metro config, global.css, TypeScript types, safe area setup                                                          |
| [uniwind-api.md](references/uniwind-api.md)       | CRITICAL | className prop, utility classes, withUniwind() HOC, hooks, data selectors, CSS functions, built-in component support |
| [uniwind-theming.md](references/uniwind-theming.md) | HIGH   | dark: variant, CSS variable tokens, custom themes, Uniwind.setTheme(), updateCSSVariables()                          |
| [uniwind-patterns.md](references/uniwind-patterns.md) | HIGH | Platform variants, responsive breakpoints, state variants, component composition, safe area utilities, gradients    |

## Problem -> Skill Mapping

| Problem                                | Reference                                                   |
| -------------------------------------- | ----------------------------------------------------------- |
| Setting up Uniwind from scratch        | `uniwind-setup.md`                                          |
| Creating themed styles                 | `uniwind-theming.md`                                        |
| Dark mode support                      | `uniwind-theming.md` (CSS variable tokens auto-switch)      |
| Custom themes beyond light/dark        | `uniwind-theming.md` (custom themes with `extraThemes`)     |
| Responsive layout                      | `uniwind-patterns.md` (breakpoints)                         |
| Component variants (size, color)       | `uniwind-patterns.md` (className maps)                      |
| Safe area insets                       | `uniwind-patterns.md` (`p-safe`, `pt-safe`)                 |
| Platform-specific styles               | `uniwind-patterns.md` (`ios:`, `android:`, `web:`, `native:`) |
| Styling third-party components         | `uniwind-api.md` (`withUniwind` HOC)                        |
| Accessing CSS variables in JS          | `uniwind-api.md` (`useCSSVariable` hook)                    |
| Prop-based conditional styling         | `uniwind-api.md` (data selectors `data-[prop=value]:`)      |
| Device-specific CSS functions          | `uniwind-api.md` (`hairlineWidth()`, `fontScale()`, `pixelRatio()`) |
| Gradients                              | `uniwind-patterns.md` (built-in gradient utilities)         |
| Resolving classes to style objects     | `uniwind-api.md` (`useResolveClassNames` — use rarely)      |
| Persisting theme preference            | `uniwind-theming.md` (MMKV + Uniwind.setTheme)              |

## DNS Design Tokens

All tokens live in [`apps/mobile/src/global.css`](../../../../apps/mobile/src/global.css) and are a direct mirror of the Figma design system (scopes: Branding, Semantic, Elements, Background, Forms, Active). When a Figma hex changes, update the token here — never inline.

### Primitives (static, theme-agnostic)

| Category | Example | Values |
|---|---|---|
| Spacing | `p-xxs` (4) → `p-7xl` (64) | `none` `xxs` `xs` `s` `m` `l` `xl` `2xl` `3xl` `4xl` `5xl` `6xl` `7xl` (values: 0 4 8 12 16 20 24 28 32 40 48 56 64 — match Figma `space/`) |
| Radius | `rounded-4` (4px) → `rounded-32` (32px); plus `rounded-none` / `rounded-full` | Numeric names match Figma `radius/`: `none` `4` `8` `12` `16` `20` `24` `28` `32` `full` |
| Border width | default `border` (1px) + `border-2` `border-4` `border-8`; `hairline` via custom utility | Numeric match Figma `stroke/`: `hairline`(0.5) `1` `2` `4` `8` |
| Typography | `text-display-lg/md` `text-title-lg/md/sm` `text-body-lg/md/sm` `text-caption` `text-overline` `text-button-lg/sm` `text-link` | Inter — bundled font/size/line-height/weight |
| Breakpoints | `sm:` (576) `md:` (768) `lg:` (992) | — |

### Colors (theme-aware, auto-switch light/dark)

Figma scope → class prefix mapping:

| Figma scope | Class prefix | Purpose |
|---|---|---|
| **Branding / primary (solid)** | `bg-primary-default` `text-primary-on` `bg-primary-active` `bg-primary-subtle` `text-primary-on-subtle` `text-primary-link` | Solid pink brand — CTA fallback, chips, brand surfaces |
| **Branding / primary gradient** | `<GradientView variant="brand-primary" />` | Main CTA fill — not a class, see "Gradients" below |
| **Branding / secondary** | `bg-secondary-default` `text-secondary-on` `bg-secondary-active` | White buttons / neutral surfaces |
| **Semantic / positive** | `bg-success-default` `text-success-on` `bg-success-active` `bg-success-subtle` | Approval, availability |
| **Semantic / orange** (warning) | `bg-warning-default` `text-warning-on` `bg-warning-active` `bg-warning-subtle` | Warning (Figma names it "orange"; role is `warning`) |
| **Semantic / negative** | `bg-error-default` `text-error-on` `bg-error-active` `bg-error-subtle` | Error, rejection |
| **Elements (text)** | `text-content-primary` `text-content-secondary` `text-content-tertiary` `text-content-disabled` `text-content-inverse` `text-content-error` `text-content-link` `text-content-on-brand` `text-content-white` `text-content-black` | All text colors. `content-white`/`content-black` stay fixed across themes |
| **Background** | `bg-bg-canvas` `bg-bg-surface` `bg-bg-elevated` `bg-bg-block` (glass) `bg-bg-overlay` (dim) `bg-bg-inverse` | Surfaces. `bg-block` pairs with `backdrop-blur-*` |
| **Background / screen (gradient)** | `<GradientView variant="screen" />` | Subtle pink-blue tint — see "Gradients" |
| **Forms** | `border-form-border` `border-form-border-active` `bg-form-bg-disabled` + aliases `border-border-default` `border-border-form-focus` `bg-disabled-bg` | Input borders / disabled fields |
| **Border (generic)** | `border-border-default` `border-border-subtle` `border-border-strong` `border-border-focus` `border-border-error` | Cross-cutting borders |
| **Divider** | `bg-divider-primary` | Section dividers |
| **Icon** | `text-icon-default` `text-icon-secondary` `text-icon-inverse` | Icon tint colors |
| **Disabled** | `bg-disabled-bg` `text-disabled-content` `border-disabled-border` | Disabled controls |
| **Active (pressed)** | Handled via `active:bg-*-active` variants on interactive elements | — |

### Key hex values (light mode — source of truth)

```
Branding/primary:            #E41B5E   → primary-default
Branding/primary gradient:   #FF5537 → #F22469 @ 105.56°   → GradientView variant="brand-primary"
Active/primary (pressed):    #FF826D → #FF548D @ 105.56°   → GradientView variant="brand-active"
Active/secondary (solid):    #B31549                        → primary-active
Branding/secondary:          #FFFFFF                        → secondary-default
Semantic/positive:           #00AB3C                        → success-default
Semantic/orange (warning):   #FF8C40                        → warning-default
Semantic/negative:           #FF0021                        → error-default
Elements/primary:            #1E2932                        → content-primary
Elements/secondary:          #58616A                        → content-secondary
Elements/tertiary:           #687885                        → content-tertiary
Elements/disabled:           #BBBBBB                        → content-disabled / disabled-content
Forms/border:                #E6E6E6                        → form-border / border-default
Forms/border input active:   #F73656                        → form-border-active / border-form-focus
Forms/bg input disabled:     #E0E2E4                        → form-bg-disabled / disabled-bg
Background/screen:           #F4FAFF → #FFF1FB              → GradientView variant="screen"
```

## Gradients (expo-linear-gradient)

Figma's Branding/primary and Background/screen are **actual gradients**, not solid colors — they must render as gradients. React Native doesn't support CSS `linear-gradient`, so gradients live in a typed wrapper: [`GradientView`](../../../../apps/mobile/src/shared/ui/components/common/GradientView.tsx).

### Presets

| `variant` | Figma origin | Use for |
|---|---|---|
| `brand-primary` | Branding/primary gradient | Primary CTA background (enabled state) |
| `brand-active` | Active/primary gradient | Primary CTA background (pressed state) |
| `screen` | Background/screen | Subtle background tint for landing/auth/hero screens |

### Pattern

```tsx
import { StyleSheet } from 'react-native';
import { GradientView } from '@/shared/ui/components';

// As a full-screen background (on a View with `relative`)
<View className="flex-1">
  <GradientView variant="screen" style={StyleSheet.absoluteFill} />
  {/* content on top */}
</View>

// As a fill inside a Pressable (AppButton primary pattern)
<Pressable className="rounded-12 overflow-hidden">
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

### Rules

1. **Gradients only via `GradientView`** — never inline a `<LinearGradient colors={['#xxx', '#yyy']} />`. Hardcoded gradient colors bypass the design system the same way raw hex bypasses color tokens.
2. **Use `StyleSheet.absoluteFill`** as the gradient's style — a stable RN constant for absolute-fill background. Avoids creating a new style object per render.
3. **Set `overflow-hidden`** on the parent so the gradient respects `rounded-*` from the container.
4. **Never use a `bg-*-gradient` Tailwind utility** — Uniwind Pro compiles those to `linearGradient` CSS, which React Native cannot render natively. Always use `<GradientView>`.
5. **Add a new preset, don't inline colors** — if a design needs a gradient not in `GRADIENT_PRESETS`, add it to [`GradientView.tsx`](../../../../apps/mobile/src/shared/ui/components/common/GradientView.tsx) first.
