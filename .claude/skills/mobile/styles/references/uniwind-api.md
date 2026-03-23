---
title: Uniwind Pro Core API & Utility Classes
impact: CRITICAL
tags: uniwind-pro, classname, withUniwind, utility-classes, hoc, hooks, data-selectors, css-functions, components
---

# Uniwind Pro Core API & Utility Classes

## Quick Pattern

```tsx
// NEVER — inline style objects
<View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>

// ALWAYS — Uniwind className
<View className="flex-1 bg-bg-primary p-lg">
  <Text className="text-lg font-figtree-bold text-content-primary">Title</Text>
</View>
```

## Built-in Component Support

All React Native built-in components support `className` out of the box:

| Component | className Bindings |
|-----------|-------------------|
| **View** | `className` |
| **Text** | `className`, `selectionColorClassName` (accent-) |
| **Pressable** | `className` |
| **Image** | `className`, `colorClassName` (accent-) |
| **ImageBackground** | `className`, `imageClassName`, `tintColorClassName` (accent-) |
| **TextInput** | `className`, `cursorColorClassName`, `selectionColorClassName`, `placeholderTextColorClassName`, `selectionHandleColorClassName`, `underlineColorAndroidClassName` (all accent-) |
| **ScrollView** | `className`, `contentContainerClassName`, `endFillColorClassName` (accent-) |
| **FlatList** | `className`, `columnWrapperClassName`, `contentContainerClassName`, `ListFooterComponentClassName`, `ListHeaderComponentClassName` |
| **SectionList** | `className`, `contentContainerClassName`, `ListFooterComponentClassName`, `ListHeaderComponentClassName` |
| **Switch** | `className`, `thumbColorClassName`, `trackColorOnClassName`, `trackColorOffClassName`, `ios_backgroundColorClassName` (all accent-) |
| **Modal** | `className`, `backdropColorClassName` (accent-) |
| **ActivityIndicator** | `className`, `colorClassName` (accent-) |
| **SafeAreaView** | `className` |
| **KeyboardAvoidingView** | `className`, `contentContainerClassName` |
| **TouchableOpacity** | `className` |
| **TouchableHighlight** | `className`, `underlayColorClassName` (accent-) |
| **RefreshControl** | `className`, `colorClassName`, `tintColorClassName`, `titleColorClassName`, `progressBackgroundColorClassName` (all accent-) |
| **Button** | `colorClassName` (accent-) |

### Color Prop Convention

- **For `style` props:** Use regular Tailwind classes — `className="p-4 bg-blue-500"`
- **For non-style color props:** Use `accent-` prefix — `colorClassName="accent-blue-500"`

```tsx
<ActivityIndicator colorClassName="accent-brand-primary" size="large" />
<Switch
  trackColorOnClassName="accent-brand-primary"
  trackColorOffClassName="accent-gray-300"
/>
<TextInput
  className="border border-field-border rounded-md p-md text-content-primary"
  placeholderTextColorClassName="accent-content-tertiary"
  placeholder="Enter email"
/>
```

## Common Utility Classes

### Layout

| Class | Style |
|-------|-------|
| `flex-1` | `flex: 1` |
| `flex-row` | `flexDirection: 'row'` |
| `flex-col` | `flexDirection: 'column'` (default) |
| `flex-wrap` | `flexWrap: 'wrap'` |
| `items-center` | `alignItems: 'center'` |
| `justify-center` | `justifyContent: 'center'` |
| `justify-between` | `justifyContent: 'space-between'` |
| `self-start` | `alignSelf: 'flex-start'` |
| `absolute` | `position: 'absolute'` |
| `relative` | `position: 'relative'` |
| `hidden` | `display: 'none'` |
| `overflow-hidden` | `overflow: 'hidden'` |
| `z-10` | `zIndex: 10` |

### Spacing

| Class | Style |
|-------|-------|
| `p-4` | `padding: 16` |
| `px-4` | `paddingHorizontal: 16` |
| `py-2` | `paddingVertical: 8` |
| `pt-4` | `paddingTop: 16` |
| `m-4` | `margin: 16` |
| `mt-2` | `marginTop: 8` |
| `-mt-2` | `marginTop: -8` |
| `gap-4` | `gap: 16` |

**Custom project tokens:** `p-xxs`(2), `p-xs`(4), `p-sm`(8), `p-md`(12), `p-lg`(16), `p-xl`(20), `p-xxl`(24), `p-3xl`(32), `p-4xl`(48), `p-5xl`(56), `p-6xl`(68)

### Sizing

| Class | Style |
|-------|-------|
| `w-full` | `width: '100%'` |
| `w-1/2` | `width: '50%'` |
| `w-64` | `width: 256` |
| `h-12` | `height: 48` |
| `min-h-screen` | `minHeight: screenHeight` |
| `aspect-square` | `aspectRatio: 1` |
| `aspect-video` | `aspectRatio: 16/9` |

### Typography

| Class | Style |
|-------|-------|
| `text-xs` | `fontSize: 12` |
| `text-sm` | `fontSize: 14` |
| `text-base` | `fontSize: 16` |
| `text-lg` | `fontSize: 18` |
| `text-xl` | `fontSize: 20` |
| `text-2xl` | `fontSize: 24` |
| `font-bold` | `fontWeight: '700'` |
| `font-semibold` | `fontWeight: '600'` |
| `font-medium` | `fontWeight: '500'` |
| `text-center` | `textAlign: 'center'` |
| `leading-tight` | tight line height |
| `tracking-wide` | wide letter spacing |
| `uppercase` | `textTransform: 'uppercase'` |
| `line-through` | `textDecorationLine: 'line-through'` |
| `underline` | `textDecorationLine: 'underline'` |

**Custom project fonts:** `font-figtree-regular`, `font-figtree-medium`, `font-figtree-semibold`, `font-figtree-bold`

### Colors

```tsx
// Background — use semantic tokens
<View className="bg-bg-primary" />
<View className="bg-brand-primary" />
<View className="bg-black/50" />  {/* 50% opacity */}

// Text — use semantic tokens
<Text className="text-content-primary" />
<Text className="text-error" />

// Border
<View className="border-field-border" />
<View className="border-divider" />
```

### Borders & Rounded

| Class | Style |
|-------|-------|
| `border` | `borderWidth: 1` |
| `border-2` | `borderWidth: 2` |
| `border-t` | `borderTopWidth: 1` |
| `rounded` | `borderRadius: 4` |
| `rounded-lg` | `borderRadius: 8` |
| `rounded-xl` | `borderRadius: 12` |
| `rounded-2xl` | `borderRadius: 16` |
| `rounded-full` | `borderRadius: 9999` |

**Custom project radius:** `rounded-xs`(4), `rounded-sm`(8), `rounded-md`(12), `rounded-lg`(16), `rounded-xl`(20), `rounded-xxl`(24), `rounded-full`(9999)

### Effects

| Class | Style |
|-------|-------|
| `shadow-sm` | small shadow |
| `shadow-md` | medium shadow |
| `shadow-lg` | large shadow |
| `opacity-50` | `opacity: 0.5` |

### Transforms

| Class | Description |
|-------|-------------|
| `translate-x-4` | translateX: 16 |
| `translate-y-2` | translateY: 8 |
| `rotate-45` | rotate: 45deg |
| `scale-110` | scale: 1.1 |

## Conditional Classes

```tsx
// WORKS — complete class names in ternary
<View className={`p-4 rounded-lg ${isActive ? 'bg-brand-primary' : 'bg-bg-secondary'}`}>
  <Text className={`font-figtree-semibold ${isActive ? 'text-white' : 'text-content-primary'}`}>
    {label}
  </Text>
</View>

// DOES NOT WORK — dynamic class construction
const color = 'blue';
const bg = `bg-${color}-500`; // Won't compile!
```

**Rule:** Class names must be statically analyzable. Uniwind Pro compiles at build time.

## Data Selectors (v1.3.0+)

Apply styles conditionally based on component props using `data-[prop=value]` variants:

```tsx
// Boolean prop
<View
  data-selected={isSelected}
  className="bg-bg-secondary data-[selected=true]:bg-brand-primary rounded-xl p-md"
>
  <Text className="text-content-primary data-[selected=true]:text-white">
    Item
  </Text>
</View>

// String prop
<View
  data-status={status}
  className="p-sm rounded-md data-[status=success]:bg-success-light data-[status=error]:bg-error-light data-[status=warning]:bg-warning-light"
/>

// Multiple selectors
<Pressable
  data-size={size}
  data-variant={variant}
  className="rounded-xl data-[size=sm]:py-2 data-[size=md]:py-3 data-[size=lg]:py-4 data-[variant=primary]:bg-brand-primary data-[variant=secondary]:bg-bg-secondary"
/>
```

**Limitations:**
- Only equality checks: `data-[prop=value]` — no presence-only `data-[prop]`
- Booleans match both boolean and string forms

## CSS Functions

Must be defined as utilities in `global.css` before use — cannot use directly in className.

### hairlineWidth()

Thinnest displayable line. For borders and dividers:

```css
/* global.css */
@utility h-hairline {
  height: hairlineWidth();
}
@utility border-hairline {
  border-width: hairlineWidth();
}
```

```tsx
<View className="h-hairline bg-divider" />
```

### fontScale()

Multiplies base size by device font scale (accessibility). Respects user text size preference:

```css
@utility text-base-scaled {
  font-size: fontScale();     /* 1x device scale */
}
@utility text-sm-scaled {
  font-size: fontScale(0.9);  /* 0.9x device scale */
}
```

### pixelRatio()

Multiplies value by device pixel ratio. For pixel-perfect sizing:

```css
@utility w-icon {
  width: pixelRatio();
}
@utility w-avatar {
  width: pixelRatio(2);
}
```

### light-dark()

Different values per theme, resolved at runtime:

```css
@utility bg-adaptive {
  background-color: light-dark(#ffffff, #1f2937);
}
@utility text-adaptive {
  color: light-dark(#111827, #f9fafb);
}
```

**Tip:** Prefer CSS variable tokens in `@layer theme` over `light-dark()` for consistency.

## Custom CSS Classes

Write traditional CSS alongside Tailwind utilities for complex reusable patterns:

```css
/* global.css */
.card-elevated {
  background-color: light-dark(#ffffff, #1f2937);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

```tsx
<View className="card-elevated m-4">
  <Text className="text-lg font-figtree-bold text-content-primary">{title}</Text>
</View>
```

**Best practice:** Prefer Tailwind utilities for simple styles. Use custom CSS only for complex reusable patterns that would be verbose with utilities.

**Avoid:** Deeply nested CSS selectors — React Native's style model is flat.

## withUniwind() HOC

For third-party components without native `className` support:

```typescript
import { withUniwind } from 'uniwind';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

// ALWAYS define at module level, never inside components
const StyledBlurView = withUniwind(BlurView);
const StyledMotiView = withUniwind(MotiView);

// Usage
<StyledBlurView className="flex-1 rounded-xl overflow-hidden" />
```

### Automatic Prop Mapping

`withUniwind` auto-creates className variants for style/color props:

| Original Prop | Auto-Generated |
|--------------|----------------|
| `style` | `className` |
| `color` | `colorClassName` |
| `backgroundColor` | `backgroundColorClassName` |
| `tintColor` | `tintColorClassName` |
| `contentContainerStyle` | `contentContainerClassName` |

### Custom Prop Mapping

```typescript
const StyledProgressBar = withUniwind(ProgressBar, {
  width: {
    fromClassName: 'widthClassName',
    styleProperty: 'width',
  },
});

<StyledProgressBar widthClassName="w-64" progress={0.5} />
```

### SVG Color Mapping

```typescript
import { Path } from 'react-native-svg';

const StyledPath = withUniwind(Path, {
  stroke: {
    fromClassName: 'strokeClassName',
    styleProperty: 'accentColor',
  },
  fill: {
    fromClassName: 'fillClassName',
    styleProperty: 'accentColor',
  },
});

<StyledPath strokeClassName="accent-red-500" fillClassName="accent-transparent" />
```

## Hooks

### useUniwind()

Access current theme info. **Use rarely** — for logic, not styling:

```tsx
import { useUniwind } from 'uniwind';

const { theme, hasAdaptiveThemes } = useUniwind();
// theme: 'light' | 'dark' | 'system' | custom
// hasAdaptiveThemes: boolean
```

### useCSSVariable()

Access CSS variable values in JS. Reactive to theme changes:

```tsx
import { useCSSVariable } from 'uniwind';

// Single variable
const primaryColor = useCSSVariable('--color-brand-primary');

// Multiple variables (one subscription — more efficient)
const [bgColor, spacing] = useCSSVariable([
  '--color-bg-primary',
  '--spacing-lg',
]);
```

**Required:** Variables must be either used in a className somewhere or defined in `@theme static`.

### useResolveClassNames()

Convert className strings to style objects. **Use rarely** — prefer `className` or `withUniwind`:

```tsx
import { useResolveClassNames } from 'uniwind';

const styles = useResolveClassNames('bg-brand-primary p-4 rounded-xl');
// Returns React Native style object

<ThirdPartyComponent style={styles} />
```

Use cases: react-navigation theme config, libraries that only accept style objects.

## Unsupported Classes

Not available on React Native:

- `hover:*` — use `active:` for press state
- `visited:*`, `before:*`, `after:*` — no pseudo-elements
- `placeholder:*` — use `placeholderTextColorClassName` instead
- `float-*`, `clear-*` — no float layout
- `columns-*` — no multi-column
- `grid-*` — in progress
- `print:*`, `screen:*` — no media type queries

## Build-Time Compilation

1. Metro encounters `className="bg-brand-primary p-lg rounded-xl"`
2. Uniwind Pro compiler parses class names at build time
3. Generates optimized `StyleSheet.create()` objects
4. At runtime, components receive pre-computed style objects

**Result:** Near-native StyleSheet performance with zero runtime CSS parsing.

## Common Pitfalls

1. **Dynamic class names** — `bg-${variable}-500` won't compile. Use complete names in ternaries
2. **Mixing style and className** — avoid on same element. `style` overrides `className`
3. **withUniwind inside render** — define at module level to prevent recreation each render
4. **Missing wrapping** — third-party components need `withUniwind` before `className` works
5. **Class deduplication** — Uniwind doesn't auto-deduplicate. Use `tailwind-merge` + `clsx` for `cn()` utility if needed
