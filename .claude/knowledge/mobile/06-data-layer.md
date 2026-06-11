# 09 - Data Layer

## Structure (planned)

```
src/data/
├── domains/
│   ├── auth/
│   │   ├── auth.api.ts
│   │   └── auth.types.ts
│   ├── workout/
│   │   ├── workout.api.ts
│   │   └── workout.types.ts
│   └── ... (one per domain)
└── index.ts
```

## API File Pattern

```typescript
import { httpClient } from '@/services/http.service';
import { Workout, CreateWorkoutRequest } from './workout.types';

const getWorkouts = () => httpClient.get<Workout[]>('/workout');
const createWorkout = (data: CreateWorkoutRequest) => httpClient.post<Workout>('/workout', data);

export const WorkoutApi = { getWorkouts, createWorkout };
```

## Rules

- Thin wrappers around httpClient
- Types in companion `.types.ts` file
- All exported via barrel: `import { WorkoutApi } from '@/data'`
- No business logic
- No React imports
