---
title: Uniwind Pro Patterns & Best Practices
impact: HIGH
tags: uniwind-pro, safe-area, platform-variants, responsive, component-patterns, best-practices, gradients, data-selectors
---

# Uniwind Pro Patterns & Best Practices

## Quick Reference

| Category | Syntax | Example |
|----------|--------|---------|
| Safe area padding | `p-safe`, `pt-safe`, `pb-safe` | `<View className="pt-safe pb-safe">` |
| Safe area margin | `m-safe`, `mt-safe`, `mb-safe` | `<View className="mt-safe">` |
| Safe area position | `top-safe`, `bottom-safe` | `<View className="absolute bottom-safe">` |
| Safe area + min | `-safe-or-{value}` | `<View className="pt-safe-or-4">` |
| Safe area + offset | `-safe-offset-{value}` | `<View className="pb-safe-offset-4">` |
| Platform | `ios:`, `android:`, `web:`, `native:` | `<View className="ios:shadow-md android:elevation-4">` |
| State | `active:`, `focus:`, `disabled:` | `<Pressable className="active:bg-blue-600">` |
| Responsive | `sm:`, `md:`, `lg:`, `xl:` | `<View className="p-4 md:p-8 lg:p-12">` |
| Data selector | `data-[prop=value]:` | `<View data-active={true} className="data-[active=true]:bg-blue-500">` |

## Platform Variants

Use platform selectors instead of `Platform.select()`:

```tsx
// CORRECT — clean, declarative
<View className="ios:shadow-md android:elevation-4 native:p-4 web:p-6" />

// INCORRECT — verbose, requires import
import { Platform } from 'react-native';
<View style={Platform.select({ ios: { shadowOpacity: 0.1 }, android: { elevation: 4 } })} />
```

### Available Selectors

| Selector | Target |
|----------|--------|
| `ios:` | iOS only |
| `android:` | Android only |
| `web:` | Web only (React Native Web) |
| `native:` | iOS + Android (not web) |

**Tip:** Use `native:` when iOS and Android styles are identical and only web differs.

```tsx
// Instead of duplicating ios: and android:
<View className="native:bg-blue-500 web:bg-gray-500">
  <Text className="native:text-white web:text-black">Mobile vs Web</Text>
</View>
```

### Platform-Specific Shadows

```tsx
<View className="bg-bg-primary rounded-xl p-lg ios:shadow-md android:elevation-4">
  <Text className="text-content-primary">Card with platform shadow</Text>
</View>
```

### Platform Media Queries in @theme

For global token overrides per platform (fonts, spacing):

```css
/* global.css */
@layer theme {
  :root {
    --font-sans: 'Inter';
    @media ios {
      --font-sans: 'SF Pro Text';
      --text-base: 17px;
    }
    @media android {
      --font-sans: 'Roboto';
      --text-base: 14px;
    }
  }
}
```

**Note:** `@media ios/android/web` only work inside `@theme` or `@layer theme`, not in component className.

## Responsive Breakpoints

Mobile-first approach — unprefixed utilities apply to all sizes, prefixed apply at that breakpoint and above.

### Default Breakpoints

| Prefix | Min Width |
|--------|-----------|
| (none) | 0px (mobile) |
| `sm:` | 576px (this project's custom) |
| `md:` | 768px |
| `lg:` | 992px (this project's custom) |

### Usage

```tsx
// Mobile-first: start small, enhance for larger
<View className="p-sm sm:p-md lg:p-xl">
  <Text className="text-base sm:text-lg lg:text-xl font-figtree-bold">Responsive Title</Text>
</View>

// Responsive grid
<View className="flex-row flex-wrap">
  <View className="w-full sm:w-1/2 lg:w-1/3 p-xs">
    <View className="bg-bg-secondary p-md rounded-md">
      <Text className="text-content-primary">Item</Text>
    </View>
  </View>
</View>

// Responsive visibility
<View className="hidden sm:flex flex-row gap-lg">
  <Text>Desktop nav</Text>
</View>
<View className="flex sm:hidden">
  <Text>Mobile hamburger</Text>
</View>
```

**Rule:** Design mobile-first. Start with mobile layout (no prefix), then use `sm:`, `md:`, `lg:` to enhance.

## State Variants

```tsx
// Press state
<Pressable className="bg-brand-primary active:bg-brand-primary-pressed rounded-xl py-md px-xl">
  <Text className="text-button-primary-content text-center font-figtree-semibold">Press Me</Text>
</Pressable>

// Disabled state
<Pressable
  disabled={isLoading}
  className="bg-brand-primary active:bg-brand-primary-pressed disabled:bg-button-disabled disabled:opacity-50 rounded-xl py-md"
>
  <Text className="text-button-primary-content text-center font-figtree-semibold">
    {isLoading ? 'Loading...' : 'Submit'}
  </Text>
</Pressable>

// Focus state (TextInput)
<TextInput
  className="border border-field-border focus:border-brand-primary rounded-md px-md py-md text-content-primary"
  placeholderTextColorClassName="accent-content-tertiary"
  placeholder="Enter email"
/>
```

## Safe Area Utilities

Replace `SafeAreaView` with utility classes (requires SafeAreaListener setup — see uniwind-setup.md):

```tsx
// Screen with safe area padding
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-bg-primary pt-safe pb-safe">
      {children}
    </View>
  );
}

// Header with safe area top
function Header({ title }: { title: string }) {
  return (
    <View className="pt-safe bg-bg-primary border-b border-divider">
      <View className="px-lg py-md">
        <Text className="text-lg font-figtree-bold text-content-primary">{title}</Text>
      </View>
    </View>
  );
}

// Bottom bar with safe area
function BottomBar() {
  return (
    <View className="pb-safe bg-bg-primary border-t border-divider">
      <View className="flex-row justify-around py-xs">
        {/* tab buttons */}
      </View>
    </View>
  );
}
```

### Advanced Safe Area

| Pattern | Description |
|---------|-------------|
| `pt-safe-or-4` | Safe area top OR 16px, whichever is larger |
| `pb-safe-offset-4` | Safe area bottom + additional 16px |

```tsx
<View className="pt-safe-or-4">
  {/* At least 16px padding, or safe area if larger */}
</View>
```

## Gradients

### Built-in Gradient Support

```tsx
// Directional gradients
<View className="bg-gradient-to-r from-blue-500 to-purple-500 p-lg rounded-xl">
  <Text className="text-white font-figtree-bold">Gradient card</Text>
</View>

// With via stop
<View className="bg-gradient-to-br from-brand-primary via-purple-500 to-pink-500" />

// Angle-based
<View className="bg-linear-45 from-blue-500 to-green-500" />

// Custom arbitrary
<View className="bg-linear-[25deg,red_5%,yellow_60%,lime_90%,teal]" />
```

Available directions: `bg-gradient-to-r`, `bg-gradient-to-l`, `bg-gradient-to-t`, `bg-gradient-to-b`, `bg-gradient-to-br`, `bg-gradient-to-bl`, `bg-gradient-to-tr`, `bg-gradient-to-tl`

### expo-linear-gradient

For complex gradients with `expo-linear-gradient`, use `useCSSVariable` for theme colors:

```tsx
import { useCSSVariable } from 'uniwind';
import { LinearGradient } from 'expo-linear-gradient';

function GradientBg() {
  const [start, end] = useCSSVariable(['--color-brand-primary', '--color-brand-dark']);
  return <LinearGradient colors={[start, end]} className="flex-1" />;
}
```

## Component Composition Pattern

For components with visual variants, use className maps:

```tsx
// shared/ui/components/buttons/Button.tsx

const sizeClasses = {
  small: 'py-xs px-sm',
  medium: 'py-md px-lg',
  large: 'py-lg px-xl',
} as const;

const variantClasses = {
  primary: 'bg-button-primary active:opacity-80',
  secondary: 'bg-bg-secondary active:opacity-80',
  outline: 'border border-brand-primary active:bg-brand-light',
  ghost: 'active:bg-bg-tertiary',
} as const;

const textClasses = {
  primary: 'text-button-primary-content',
  secondary: 'text-content-primary',
  outline: 'text-brand-primary',
  ghost: 'text-content-primary',
} as const;

interface ButtonProps {
  label: string;
  onPress: () => void;
  size?: keyof typeof sizeClasses;
  variant?: keyof typeof variantClasses;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  size = 'medium',
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-xl items-center ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <Text className={`font-figtree-semibold ${textClasses[variant]}`}>{label}</Text>
    </Pressable>
  );
}
```

## Card Pattern

```tsx
const cardVariants = {
  elevated: 'bg-bg-primary ios:shadow-md android:elevation-4 rounded-2xl',
  outlined: 'bg-transparent border border-divider rounded-2xl',
  filled: 'bg-bg-secondary rounded-2xl',
} as const;

interface CardProps {
  children: React.ReactNode;
  variant?: keyof typeof cardVariants;
  className?: string;
}

export function Card({ children, variant = 'elevated', className = '' }: CardProps) {
  return (
    <View className={`p-lg ${cardVariants[variant]} ${className}`}>
      {children}
    </View>
  );
}
```

## List Item Pattern

```tsx
function ListItem({ title, subtitle, onPress }: ListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-lg py-md active:bg-bg-secondary"
    >
      <View className="flex-1">
        <Text className="text-base font-figtree-medium text-content-primary">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-content-secondary mt-xxs">{subtitle}</Text>
        )}
      </View>
    </Pressable>
  );
}
```

## Input Pattern

```tsx
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="mb-lg">
      {label && (
        <Text className="text-sm font-figtree-medium text-content-primary mb-xs">{label}</Text>
      )}
      <TextInput
        className={`h-12 border rounded-sm px-lg text-base text-content-primary bg-field-bg ${
          error ? 'border-error' : 'border-field-border'
        } focus:border-brand-primary ${className}`}
        placeholderTextColorClassName="accent-content-tertiary"
        {...props}
      />
      {error && (
        <Text className="text-xs text-error mt-xxs">{error}</Text>
      )}
    </View>
  );
}
```

## Organizing Long Class Lists

```tsx
// Array join pattern
<View
  className={[
    'flex-row items-center',
    'bg-bg-primary rounded-2xl p-lg',
    'border border-divider',
    'ios:shadow-sm android:elevation-2',
  ].join(' ')}
/>

// Or extract to constant
const containerClasses = 'flex-row items-center bg-bg-primary rounded-2xl p-lg border border-divider';
<View className={containerClasses} />
```

## className Deduplication

Uniwind doesn't auto-deduplicate. If passing `className` props from parent, use `tailwind-merge`:

```typescript
// shared/helpers/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
import { cn } from '@/shared/helpers/cn';

<View className={cn('bg-red-500 p-4', isActive && 'bg-blue-500', className)} />
// bg-blue-500 wins over bg-red-500 when isActive is true
```

## Performance Notes

- **Build-time compilation** — all class names resolved during Metro bundling, zero runtime CSS parsing
- **Static analysis** — class names must be complete strings; `bg-${color}-500` won't work
- **No overhead** — pre-computed StyleSheet objects as fast as hand-written `StyleSheet.create()`
- **Avoid runtime string building** — use ternaries with complete class names

## Common Pitfalls

1. **Dynamic class construction** — `bg-${var}-500` won't compile. Use ternaries with full names
2. **Missing dark: counterparts** — when using `dark:` approach, always pair light colors
3. **Variant nesting order** — `ios:active:bg-blue-600` (platform first, state second)
4. **Over-nesting variants** — keep to 2 levels max for readability
5. **Mixing style and className** — choose one per component; `style` overrides `className`
6. **Responsive: desktop-first** — always design mobile-first, then enhance with `sm:`, `md:`, `lg:`
