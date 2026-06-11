---
name: widgets
description: Widget (composed component) patterns for the DNS mobile app. Widgets are complex UI components composed from atomic UI components, often with internal state.
---

# Widgets Skill

## What is a Widget?

A widget is a composed component that:

- Combines multiple UI components
- May have internal UI state (open/close, search text, selection)
- Is reusable across screens
- Lives in its own folder (not a single file)

## Widget Structure

```
shared/ui/widgets/
├── ExercisePicker/
│   ├── ExercisePicker.tsx
│   ├── ExercisePickerItem.tsx
│   ├── useExercisePicker.ts     # Internal logic hook (optional)
│   └── index.ts
├── TimerDisplay/
│   ├── TimerDisplay.tsx
│   └── index.ts
└── index.ts
```

## Widget Pattern

```tsx
// shared/ui/widgets/ExercisePicker/ExercisePicker.tsx
import React, { useState, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import { Input } from '@/shared/ui/components';
import { ExercisePickerItem } from './ExercisePickerItem';

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  selected?: string[];
}

export function ExercisePicker({ exercises, onSelect, selected = [] }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExercisePickerItem
        exercise={item}
        isSelected={selected.includes(item.id)}
        onPress={() => onSelect(item)}
      />
    ),
    [selected, onSelect],
  );

  return (
    <View className="flex-1 bg-bg-canvas p-m gap-s">
      <Input value={search} onChangeText={setSearch} placeholder="Search exercises" />
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-xs py-xs"
      />
    </View>
  );
}
```

## Rules

1. **Own folder** — each widget gets a folder, not a single file
2. **Internal state OK** — widgets can have UI state (search, open/close)
3. **No API calls** — data comes via props
4. **Composed from UI components** — use existing Button, Input, Avatar, etc.
5. **Memoize list callbacks** — `useCallback` for FlatList `renderItem`
6. **Barrel export** — `index.ts` exports the main widget component
7. **Extract sub-components** — large internal parts become separate files in the widget folder
8. **`className` only** — never `StyleSheet.create`, never inline `style={{}}`
9. **Design tokens only** — never hardcoded `#hex`, `p-4`, `rounded-lg`, `text-xl` (see [../styles/SKILL.md](../styles/SKILL.md))
10. **No hardcoded user-facing strings** — text comes from props. If the widget needs multiple text slots, receive them individually (e.g. `emptyLabel`, `searchPlaceholder`) — the consuming screen calls `useAppTranslation` directly and forwards each translated string as a prop. Widgets never call `useAppTranslation` themselves (see [../localization/SKILL.md](../localization/SKILL.md))

## Widget vs Component

|                | Component            | Widget                                       |
| -------------- | -------------------- | -------------------------------------------- |
| Complexity     | Atomic, simple       | Composed, complex                            |
| Internal state | None or minimal      | Often has state                              |
| Folder         | Single file          | Own folder                                   |
| Sub-components | None                 | May have internal components                 |
| Examples       | Button, Card, Avatar | ExercisePicker, TimerDisplay, WorkoutBuilder |
