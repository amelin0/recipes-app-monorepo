# 10 - Key Libraries

## Core

| Library      | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| expo         | SDK 55  | Framework & dev tooling |
| react-native | 0.83.2  | Mobile runtime          |
| react        | 19.2.0  | UI framework            |
| typescript   | 5.9.3   | Type safety             |

## Navigation

| Library                        | Purpose                  |
| ------------------------------ | ------------------------ |
| @react-navigation/native       | Navigation container     |
| @react-navigation/bottom-tabs  | Bottom tab navigator     |
| @react-navigation/native-stack | Native stack navigator   |
| react-native-screens           | Native screen components |
| react-native-safe-area-context | Safe area handling       |

## State & Data

| Library               | Purpose                        |
| --------------------- | ------------------------------ |
| zustand               | 5.0 — client state with slices |
| @tanstack/react-query | 5.90 — server state caching    |
| axios                 | 1.13 — HTTP client             |
| react-native-mmkv     | 4.1 — fast sync storage        |

## UI & Styling

| Library                              | Purpose                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| uniwind (`npm:uniwind-pro@latest`)   | Tailwind CSS v4 bindings for RN (`className` on every RN component)                |
| tailwindcss                          | 4.x — utility CSS, tokens defined in `apps/mobile/src/global.css`                  |
| tailwind-variants                    | `tv()` for variant/slot-driven components (see `components` skill)                 |
| expo-linear-gradient                 | Native gradients — wrapped by `GradientView` (Figma brand + screen presets)        |
| @expo-google-fonts/inter             | Inter font weights loaded at startup in `_layout.tsx`                              |
| react-native-reanimated              | 4.2 — animations                                                                   |
| react-native-gesture-handler         | Touch gestures                                                                     |
| expo-image                           | Optimized image rendering (photos / remote assets — **not** icons)                 |
| expo-haptics                         | Haptic feedback                                                                    |
| react-native-nano-icons              | Build-time SVG → icon font; used via `AppIcon` wrapper. Never `react-native-svg` for icons |
| @legendapp/list                      | High-perf virtualized list; used via `AppList` (wrapped in `withUniwind`). Never raw `FlatList` |

## Validation

| Library | Purpose                                   |
| ------- | ----------------------------------------- |
| zod     | Schema validation (from @dns/validation) |

## Shared Packages

| Package            | Purpose                  |
| ------------------ | ------------------------ |
| @dns/shared-types | TypeScript types & enums |
| @dns/validation   | Zod schemas              |
| @dns/constants    | Static data              |
| @dns/utils        | Utility functions        |
