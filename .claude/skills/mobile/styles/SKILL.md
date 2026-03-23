---
name: styles
description: Styling patterns for React Native using Uniwind Pro (Tailwind CSS v4 bindings). Covers className prop, theme configuration, responsive design, platform variants, data selectors, CSS functions, and component patterns.
version: 2.0.0
license: MIT
metadata:
  author: Inspired
  tags: styling, uniwind, tailwind, themes, responsive, breakpoints, dark-mode, platform-variants, data-selectors, css-functions
---

# Styles — Uniwind Pro

## Overview

This project uses **Uniwind Pro** — Tailwind CSS v4 utility classes compiled at build time via Metro plugin. Every React Native component gets a `className` prop out of the box. Themes (light/dark/custom) are defined in CSS with `@variant`.

> **Note:** Uniwind Pro is installed as an npm alias: `"uniwind": "npm:uniwind-pro@rc"` in `package.json`. All imports use `uniwind` / `uniwind/metro` — the alias resolves to the Pro package transparently.

## CRITICAL: Styling Rules

1. **ALWAYS use `className`** — never use `StyleSheet.create()`, inline `style` objects, or raw style props for layout/colors/spacing/typography
2. **Use design tokens** — reference CSS variables from `src/global.css` (`bg-bg-primary`, `text-content-primary`) instead of hardcoded colors
3. **Use `dark:` variant or CSS variable tokens** — for theme-aware colors, prefer semantic tokens that auto-switch (e.g. `bg-bg-primary`). Use `dark:` prefix only for one-off overrides or prototyping
4. **Use platform selectors** — `ios:`, `android:`, `web:`, `native:` instead of `Platform.select()`
5. **Use responsive breakpoints** — `sm:`, `md:`, `lg:` with mobile-first design
6. **Wrap third-party components** — use `withUniwind()` HOC at module level for components without native `className` support
7. **Never dynamically construct class names** — `bg-${color}-500` won't compile. Use complete class names in ternaries
8. **Never mix `style` and `className`** on the same component — pick one approach. `style` only for truly dynamic runtime values (animations, API-driven data)

## When to Use `style` Prop (Exceptions)

- Reanimated animated styles (`useAnimatedStyle`)
- Values computed from gestures/sensors at runtime
- Third-party libraries that require style objects and can't be wrapped with `withUniwind`

## Quick Reference

```tsx
// Basic component with Uniwind
<View className="flex-1 bg-bg-primary p-lg">
  <Text className="text-xl font-figtree-bold text-content-primary">Title</Text>
  <Text className="text-sm text-content-secondary mt-sm">Subtitle</Text>
  <Pressable className="bg-primary-default active:bg-primary-active rounded-xl py-md mt-lg">
    <Text className="text-white text-center font-figtree-semibold">Action</Text>
  </Pressable>
</View>

// Platform-specific
<View className="ios:shadow-md android:elevation-4 native:p-4 web:p-6" />

// Responsive
<View className="p-sm sm:p-md lg:p-xl" />

// Data selectors (v1.3.0+)
<View data-active={isActive} className="bg-gray-100 data-[active=true]:bg-brand-primary" />

// Third-party wrapping
const StyledBlurView = withUniwind(BlurView)
<StyledBlurView className="flex-1 rounded-xl" />
```

## Priority-Ordered Guidelines

| Priority | Category | Impact | Reference |
|----------|----------|--------|-----------|
| 1 | Setup & Configuration | CRITICAL | [uniwind-setup.md](references/uniwind-setup.md) |
| 2 | Core API & Utility Classes | CRITICAL | [uniwind-api.md](references/uniwind-api.md) |
| 3 | Theming & Dark Mode | HIGH | [uniwind-theming.md](references/uniwind-theming.md) |
| 4 | Patterns & Best Practices | HIGH | [uniwind-patterns.md](references/uniwind-patterns.md) |

## References

| File | Impact | Description |
|------|--------|-------------|
| [uniwind-setup.md](references/uniwind-setup.md) | CRITICAL | Metro config, global.css, TypeScript types, safe area setup |
| [uniwind-api.md](references/uniwind-api.md) | CRITICAL | className prop, utility classes, withUniwind() HOC, hooks, data selectors, CSS functions, built-in component support |
| [uniwind-theming.md](references/uniwind-theming.md) | HIGH | dark: variant, CSS variable tokens, custom themes, Uniwind.setTheme(), updateCSSVariables() |
| [uniwind-patterns.md](references/uniwind-patterns.md) | HIGH | Platform variants, responsive breakpoints, state variants, component composition, safe area utilities, gradients |

## Problem -> Skill Mapping

| Problem | Reference |
|---------|-----------|
| Setting up Uniwind from scratch | `uniwind-setup.md` |
| Creating themed styles | `uniwind-theming.md` |
| Dark mode support | `uniwind-theming.md` (CSS variable tokens auto-switch) |
| Custom themes beyond light/dark | `uniwind-theming.md` (custom themes with `extraThemes`) |
| Responsive layout | `uniwind-patterns.md` (breakpoints) |
| Component variants (size, color) | `uniwind-patterns.md` (className maps) |
| Safe area insets | `uniwind-patterns.md` (`p-safe`, `pt-safe`) |
| Platform-specific styles | `uniwind-patterns.md` (`ios:`, `android:`, `web:`, `native:`) |
| Styling third-party components | `uniwind-api.md` (`withUniwind` HOC) |
| Accessing CSS variables in JS | `uniwind-api.md` (`useCSSVariable` hook) |
| Prop-based conditional styling | `uniwind-api.md` (data selectors `data-[prop=value]:`) |
| Device-specific CSS functions | `uniwind-api.md` (`hairlineWidth()`, `fontScale()`, `pixelRatio()`) |
| Gradients | `uniwind-patterns.md` (built-in gradient utilities) |
| Resolving classes to style objects | `uniwind-api.md` (`useResolveClassNames` — use rarely) |
| Persisting theme preference | `uniwind-theming.md` (AsyncStorage + Uniwind.setTheme) |
