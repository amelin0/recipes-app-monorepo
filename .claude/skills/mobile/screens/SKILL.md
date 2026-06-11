---
name: screens
description: Screen creation patterns for the DNS mobile app. Each screen = presentational component + business-logic hook. Covers the hook pattern, navigation, translations placement, and screen structure.
---

# Screens Skill

## Screen Structure

Each screen lives in a domain folder:

```
view/{domain}/{screen-name}/
├── ScreenNameScreen.tsx    # JSX + useAppTranslation for copy
├── useScreenNameScreen.ts  # Business logic ONLY (state, callbacks, queries, nav)
├── components/             # Screen-local components (optional)
│   ├── SectionHeader.tsx
│   └── index.ts
└── index.ts                # Barrel export
```

## Division of responsibilities

- **Screen (`.tsx`)** — renders JSX. Calls `useAppTranslation` directly for copy. Reads state + callbacks from the screen hook.
- **Hook (`use*.ts`)** — business logic only. State, mutations, React Query, navigation calls, effects, memoization. **Never** calls `useAppTranslation`, **never** returns a `labels` object.

This separation keeps each file focused on one concern. The hook can be tested without a translation context; the JSX stays human-readable with inline copy.

## Screen Component Pattern

```tsx
// view/workout/workout-detail/WorkoutDetailScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import { AppButton } from '@/shared/ui/components';
import { Skeleton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useWorkoutDetailScreen } from './useWorkoutDetailScreen';

export function WorkoutDetailScreen() {
  const { t } = useAppTranslation(['workout', 'common']);
  const { workout, isLoading, handleStart } = useWorkoutDetailScreen();

  if (isLoading) return <Skeleton />;

  return (
    <ScrollView className="flex-1 bg-bg-canvas" contentContainerClassName="p-l pt-safe">
      <Text className="text-title-lg text-content-primary">{workout.name}</Text>
      <Text className="text-body-md text-content-secondary mt-xs">
        {workout.description}
      </Text>
      <AppButton
        label={t('workout:detail.startButton')}
        onPress={handleStart}
        className="mt-xl"
      />
    </ScrollView>
  );
}
```

## Screen Hook Pattern (business logic only)

```typescript
// view/workout/workout-detail/useWorkoutDetailScreen.ts
import { useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';

import { useGetWorkout } from '@/state/domains/workout';

export function useWorkoutDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { workoutId } = route.params as { workoutId: string };
  const { workout, isLoading } = useGetWorkout(workoutId);

  const handleStart = useCallback(() => {
    navigation.navigate('ActiveWorkout', { workoutId });
  }, [navigation, workoutId]);

  return { workout, isLoading, handleStart };
  //                                      ^ no `labels`, no `t`, no translations
}
```

## Rules

1. **Screen = JSX + translations only** — `useAppTranslation` called inline in the `.tsx`; `t('ns:key')` used directly in JSX.
2. **Hook = business logic only** — state, callbacks, queries, mutations, navigation, memoization. No `useAppTranslation`, no `labels`, no translation keys.
3. **Never a `labels` object** — don't return translated strings from the hook. If you catch yourself adding a `labels` property, move the `t()` calls back into the `.tsx`.
4. **Callbacks in `useCallback`** — all event handlers wrapped.
5. **Navigation via the router** — `useRouter()` / `useRoute()` lives in the hook.
6. **Loading + error states handled** — skeletons, error UI.
7. **Screen-local components** — extract JSX blocks > 30 lines into a `components/` subfolder.
8. **`className` only** — never `StyleSheet.create`, never inline `style={{}}`.
9. **Design tokens only** — every color/spacing/radius/font-size from `global.css`. Never `bg-white`, `p-4`, `rounded-lg`, `text-xl`, `#hex` values (see [../styles/SKILL.md](../styles/SKILL.md)).
10. **Typography utilities only** — `text-title-lg`, `text-body-md`, `text-caption` — never `text-2xl font-bold`.
11. **Safe area via utilities** — `pt-safe`, `pb-safe` — not `SafeAreaView` or manual insets.
12. **ScrollView container styles** — use `contentContainerClassName` (not `contentContainerStyle`).

## Navigation Registration (Expo Router)

Screens are referenced from `src/app/` thin route files — each route imports the screen from `view/` and re-exports as default. See [`src/app/(app)/(auth)/sign-in.tsx`](../../../../apps/mobile/src/app/(app)/(auth)/sign-in.tsx) for the canonical one-liner pattern.

## Anti-Patterns

- Direct API calls in screen files — use React Query hooks via the screen hook
- Inline business logic in JSX — extract to the screen hook
- Giant screen files > 150 lines — extract sub-components
- Navigation logic in the screen component — move to the hook
- **`labels` object returned from the hook** — banned. Put `useAppTranslation` in the `.tsx` (see [../localization/SKILL.md](../localization/SKILL.md))
- Hardcoded `#hex` colors, `fontSize: 16`, `padding: 16` — use tokens
