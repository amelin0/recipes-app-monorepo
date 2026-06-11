---
name: components
description: Component creation patterns for the DNS mobile app. Covers atomic UI components, composed widgets, props design, and Uniwind Pro styling.
---

# Components Skill

## Component Categories

### UI Components (`shared/ui/components/`)

Atomic, reusable across all domains. No business logic.

```
shared/ui/components/
├── buttons/         # Button, IconButton, SocialButton
├── inputs/          # Input, OtpInput, PinDots
├── headers/         # Header, StepHeader
├── common/          # Avatar, Badge, Skeleton, InfoBlock
├── icon/            # AppIcon, FlagIcon
├── bottom-sheets/   # BaseBottomSheet
├── modals/          # AlertModal
├── layouts/         # KeyboardLayout
├── navigation/      # TabBar
└── toasts/          # Toast, Snackbar
```

### Widgets (`shared/ui/widgets/`)

Composed components with their own internal state, often built on top of atomic components (DatePicker, PhoneInput, SelectCurrencyBottomSheet).

### Domain Components (`view/[domain]/[screen]/components/`)

Screen-local components. Never shared. Data via props, no direct hook calls.

## Component Pattern

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface WorkoutCardProps {
  title: string;
  duration: number;
  type: string;
  onPress: () => void;
}

export function WorkoutCard({ title, duration, type, onPress }: WorkoutCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="p-m rounded-16 bg-bg-elevated active:bg-bg-surface border border-border-default"
    >
      <Text className="text-body-lg text-content-primary">{title}</Text>
      <Text className="text-caption text-content-secondary mt-xxs">
        {duration} min · {type}
      </Text>
    </Pressable>
  );
}
```

## Rules

1. **One file = one component** — no multiple component exports
2. **Props interface always defined and exported** — `interface XProps { ... }`
3. **Function declaration** — `export function X()` not `export const X = () =>`
4. **No `any` types** — properly typed props
5. **Pressable over TouchableOpacity** — modern API
6. **`expo-image` over RN `Image`** — optimized loading
7. **No business logic in components** — data and callbacks via props only
8. **`className` only** — never `StyleSheet.create`, never inline `style={{}}`
9. **Design tokens only** — every color/spacing/radius/font-size from `global.css`. No `bg-white`, `p-4`, `rounded-lg`, `text-xl`, no `#hex` values (see [../styles/SKILL.md](../styles/SKILL.md))
10. **Typography utilities only** — `text-body-lg`, `text-button-lg`, `text-caption` — never raw `text-sm font-bold`
11. **`tailwind-variants` for variant-driven components** — any component with ≥2 `variant`/`size`/state props uses `tv({ slots, variants, compoundVariants })`. Never build parallel `Record<Variant, string>` maps (see "Variant Pattern" below)
12. **No hardcoded user-facing strings** — all text (button labels, placeholders, tooltips, `accessibilityLabel`) comes from the consumer via props. The consumer (screen `.tsx`) calls `useAppTranslation` directly and forwards `t('ns:key')` as a prop. Reusable components never call `useAppTranslation` themselves. See [../localization/SKILL.md](../localization/SKILL.md)
13. **Lists via `AppList`** — never use `FlatList` / `SectionList` / `ScrollView` for virtualized data. Always import `AppList` from `@/shared/ui/components` (wraps `@legendapp/list` in `withUniwind` — supports generics, `className`, `contentContainerClassName`). Plain `ScrollView` is fine only for short non-virtualized content.
14. **Icons via `AppIcon` (nano-icons)** — never use `react-native-svg` components for icons. Drop SVGs in `apps/mobile/assets/icons/app/`, run `prebuild` to regenerate the font + glyphmap, then render through the shared `AppIcon` wrapper (`createNanoIconSet(glyphMap)`). See [../icons/SKILL.md](../icons/SKILL.md) for the full workflow.
15. **Gradients via `GradientView`** — never inline `<LinearGradient colors={[...]}>` with hardcoded hex. Use a preset (`brand-primary`, `brand-active`, `screen`) from `@/shared/ui/components`. See [../styles/SKILL.md](../styles/SKILL.md#gradients-expo-linear-gradient).
16. **Barrel exports** — every folder has `index.ts`

## Variant Pattern (tailwind-variants)

Reach for `tailwind-variants` (`tv`) as soon as a component has more than one `variant`, `size`, or visual state. It keeps all class logic in one declarative config, derives typescript types for the props, and handles combinations (e.g. "link variant at `lg` size needs different padding") via `compoundVariants`.

### When to use

- ≥2 variants OR sizes OR styling states (loading, selected, invalid, disabled)
- Multi-part styling: base container + label + icon + spinner share the variant
- Token overrides across combinations (compound variants)

### When NOT to use

- Simple presentational components with no variants (e.g. `Avatar` fixed shape) — inline `className` is simpler
- Static layouts where class string never changes

### Pattern

```tsx
import { Pressable, Text, type PressableProps } from 'react-native';

import { tv, type VariantProps } from '@/shared/ui/tv';

const button = tv({
  slots: {
    base: 'flex-row items-center justify-center gap-xs',
    label: '',
  },
  variants: {
    variant: {
      primary:   { base: 'bg-primary-default active:bg-primary-active', label: 'text-primary-on' },
      outline:   { base: 'border border-border-default active:bg-bg-surface', label: 'text-content-primary' },
      destructive: { base: 'bg-error-default active:bg-error-active', label: 'text-error-on' },
      link:      { base: '', label: 'text-link text-content-link' },
    },
    size: {
      lg: { base: 'py-m px-l rounded-12', label: 'text-button-lg' },
      sm: { base: 'py-xs px-m rounded-8', label: 'text-button-sm' },
    },
    isDisabled: { true: { base: 'opacity-50' } },
  },
  compoundVariants: [
    { variant: 'link', size: 'lg', class: { base: 'py-xs px-none rounded-none', label: 'text-link' } },
    { variant: 'link', size: 'sm', class: { base: 'py-xxs px-none rounded-none', label: 'text-link' } },
  ],
  defaultVariants: { variant: 'primary', size: 'lg' },
});

type ButtonVariantProps = VariantProps<typeof button>;

export type AppButtonVariant = NonNullable<ButtonVariantProps['variant']>;
export type AppButtonSize = NonNullable<ButtonVariantProps['size']>;

export interface AppButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  className?: string;
}

export function AppButton({ label, onPress, variant, size, disabled, className, ...rest }: AppButtonProps) {
  const styles = button({ variant, size, isDisabled: disabled });
  return (
    <Pressable onPress={onPress} disabled={disabled} className={styles.base({ class: className })} {...rest}>
      <Text className={styles.label()}>{label}</Text>
    </Pressable>
  );
}
```

### Rules for tv configs

1. **Always import `tv` from `@/shared/ui/tv`** — never from `tailwind-variants` directly. The project factory disables `tailwind-merge` because it treats all our `text-*` utilities as one group and silently strips color classes when typography classes are present (e.g. drops `text-primary-on` when it sees `text-button-lg`). Uniwind compiles every class at build time; CSS source-order resolves any real conflict.
2. **Slots named by role** — `base`, `label`, `icon`, `spinner`, `container`, `content` — never by visual property (`wrap`, `outer`, `inner`)
3. **Derive prop types from tv** — `VariantProps<typeof config>` (re-exported from `@/shared/ui/tv`) → never maintain a parallel `type Variant = 'a' | 'b'` by hand
4. **Design tokens only in variant classes** — same rule as regular className; `bg-primary-default` not `bg-orange-500`
5. **Compound variants for combinatorial overrides** — don't branch in JSX (`{variant === 'link' ? ... : ...}`); declare it in `compoundVariants`
6. **Use `defaultVariants`** — don't default in destructuring; let the config own defaults
7. **Boolean state variants** — use `isLoading`, `isSelected`, `isDisabled` as `{ true: {...} }` — keeps config explicit
8. **Forward external `className`** — always accept `className` and pass via `styles.base({ class: className })`

### Reference implementation

[`apps/mobile/src/shared/ui/components/buttons/AppButton.tsx`](../../../../apps/mobile/src/shared/ui/components/buttons/AppButton.tsx) — canonical pattern with slots + compound variants.

## Anti-Patterns

- `{value && <X />}` where `value` can be `0` or `""` — use ternary: `{value ? <X /> : null}`
- Strings not wrapped in `<Text>` — always wrap
- Hardcoded colors (`#666`, `bg-white`) — use tokens (`text-content-secondary`, `bg-bg-canvas`)
- Hardcoded spacing (`p-4`, `gap-6`) — use scale (`p-m`, `gap-xl`)
- Raw typography combos (`text-xl font-bold`) — use utility (`text-title-md`)
- Deep View nesting — flatten with flex
- `StyleSheet.create` — banned; everything via `className`
- Parallel `Record<Variant, string>` maps for container/label/spinner — banned; use `tv` slots
- `{variant === 'x' ? 'classA' : 'classB'}` ternaries for variant-specific styling — use `tv` `compoundVariants`
- Manual `VariantType` union types when there's a `tv` config — derive with `VariantProps<typeof config>`
