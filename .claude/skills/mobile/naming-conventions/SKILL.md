---
name: naming-conventions
description: File and code naming conventions for the DNS mobile app. Covers folders, screens, components, hooks, services, API files, types, and Zustand slices.
---

# Naming Conventions

## File & Folder Naming

| Type           | Pattern                | Example                                         |
| -------------- | ---------------------- | ----------------------------------------------- |
| Folders        | `kebab-case`           | `workout-detail/`, `add-exercise/`              |
| Screens        | `PascalCaseScreen.tsx` | `HomeScreen.tsx`, `WorkoutDetailScreen.tsx`     |
| Screen Hooks   | `useScreenName.ts`     | `useHomeScreen.ts`, `useWorkoutDetailScreen.ts` |
| Components     | `PascalCase.tsx`       | `Button.tsx`, `WorkoutCard.tsx`                 |
| Hooks (shared) | `useCamelCase.ts`      | `useDebounce.ts`, `useAppState.ts`              |
| RQ Hooks       | `useCamelCase.ts`      | `useGetWorkout.ts`, `useCreateExercise.ts`      |
| API files      | `domain.api.ts`        | `workout.api.ts`, `auth.api.ts`                 |
| Type files     | `domain.types.ts`      | `workout.types.ts`, `user.types.ts`             |
| Zustand Slices | `domain.slice.ts`      | `auth.slice.ts`, `ui.slice.ts`                  |
| Services       | `name.service.ts`      | `http.service.ts`, `storage.service.ts`         |
| Constants      | `UPPER_SNAKE_CASE`     | `MAX_SETS`, `API_TIMEOUT`                       |

## Code Naming

| Type             | Pattern                          | Example                                       |
| ---------------- | -------------------------------- | --------------------------------------------- |
| React Components | PascalCase                       | `WorkoutCard`, `ExerciseList`                 |
| Functions        | camelCase                        | `formatDuration`, `calculatePace`             |
| Variables        | camelCase                        | `workoutData`, `isLoading`                    |
| Constants        | UPPER_SNAKE_CASE                 | `MAX_RETRY_COUNT`, `DEFAULT_REST_TIME`        |
| Types/Interfaces | PascalCase                       | `Workout`, `CreateExerciseRequest`            |
| Enums            | PascalCase + UPPER_SNAKE members | `WorkoutType.STRENGTH`                        |
| Zustand Actions  | camelCase + `Action` suffix      | `setAuthenticatedAction`, `toggleThemeAction` |
| API object       | PascalCase + `Api` suffix        | `WorkoutApi`, `AuthApi`                       |
| Query keys       | PascalCase enum `Queries`        | `Queries.WORKOUTS`, `Queries.USER_ME`         |

## Import Organization

```typescript
// 1. React & React Native
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

// 3. Internal imports (@/ alias)
import { Button } from '@/components/ui';
import { useGetWorkout } from '@/state/domains/workout';
import { useStore } from '@/store';
```

## Anti-Patterns

- `index.tsx` as a screen name — use explicit `HomeScreen.tsx`
- `helpers.ts` catch-all — split by domain or concern
- `types.ts` at root — keep types with their domain
- Hungarian notation (`strName`, `bIsActive`) — just use `name`, `isActive`
- `I` prefix for interfaces — use `Props` suffix for component props
