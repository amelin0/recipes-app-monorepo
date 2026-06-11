# Mobile - Hooks

## Shared Hooks (`src/shared/hooks/`)

Currently empty. Will contain shared custom hooks:

- `useDebounce` — debounce values
- `useAppState` — app state changes (active, background)
- `useKeyboard` — keyboard visibility

## Screen Hooks Pattern

Every screen has a companion `use{Screen}` hook in the same folder:

```typescript
// view/workout/workout-detail/useWorkoutDetailScreen.ts
export function useWorkoutDetailScreen() {
    const navigation = useNavigation();
    const { workoutId } = useRoute().params;
    const { workout, isLoading } = useGetWorkout(workoutId);

    const handleStart = useCallback(() => {
        navigation.navigate('ActiveWorkout', { workoutId });
    }, [navigation, workoutId]);

    return { workout, isLoading, handleStart };
}
```

## React Query Hooks

Per domain in `src/state/domains/{domain}/hooks/`:

- Query: `useGet{Entity}(id)`, `useGet{Entities}(params)`
- Mutation: `useCreate{Entity}()`, `useUpdate{Entity}()`, `useDelete{Entity}()`

Query keys from the centralized `Queries` enum in `shared/services/query-client/queries.ts`.
