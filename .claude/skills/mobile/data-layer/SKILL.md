---
name: data-layer
description: Data layer patterns for the DNS mobile app. Covers remote API files + types, local storages (MMKV + SecureStore), and the relationship between data and state layers.
---

# Data Layer Skill

## Structure

```
src/data/
├── remote/
│   └── domains/
│       ├── auth/
│       │   ├── auth.api.ts
│       │   └── auth.types.ts
│       ├── workout/
│       │   ├── workout.api.ts
│       │   └── workout.types.ts
│       └── index.ts                  # barrel
└── local/
    └── domains/
        ├── auth/
        │   ├── auth-storage.ts       # AuthStorage (tokens via SecureStore)
        │   └── index.ts
        ├── app/
        │   ├── app-storage.ts        # AppStorage (language, onboarding, MMKV)
        │   └── index.ts
        └── index.ts
```

## Two-layer Storage Architecture

Follow the same split as the remote/local dichotomy:

### Layer 1 — generic wrappers (low-level)

Location: `src/shared/services/storages/`. Two thin wrappers over the underlying engines:

- [`storage.service.ts`](../../../../apps/mobile/src/shared/services/storages/storage.service.ts) — **MMKV** wrapper. Sync, fast key/value. For preferences, caches, app-level flags.
- [`secure-storage.service.ts`](../../../../apps/mobile/src/shared/services/storages/secure-storage.service.ts) — **expo-secure-store** wrapper. Encrypted, async. Exclusively for sensitive data (auth tokens, biometric keys).

Both expose the same API (`writeData`, `readData`, `deleteData`) with a typed `LocalDataKeys` / `SecureDataKeys` union. The barrel re-exports them with distinct prefixes so callers never confuse the two:

```ts
// shared/services/storages/index.ts re-exports:
writeLocalData / readLocalData / deleteLocalData / clearLocalStorage  // MMKV
writeSecureData / readSecureData / deleteSecureData                    // SecureStore
```

**Rules for the generic layer**:

1. **Keep it dumb** — no domain concepts. It only knows keys and serializes/deserializes JSON.
2. **Typed keys** — add every new key to the `LocalDataKeys` / `SecureDataKeys` union. TypeScript will force you to use a known key at every call site.
3. **Never import from here directly in view/state/domain code** — always go through a domain storage class.
4. **Sensitive data only in SecureStore** — tokens, biometric keys, RSA private keys. Everything else in MMKV.

### Layer 2 — domain storages (high-level)

Location: `src/data/local/domains/{domain}/{domain}-storage.ts`. One **class per domain** with static methods that speak the domain language:

```ts
// data/local/domains/auth/auth-storage.ts
import { deleteSecureData, readSecureData, writeSecureData } from '@/shared/services';

interface TokenData { accessToken: string; refreshToken?: string }
const TOKEN_KEY = 'token';

export class AuthStorage {
  static async saveTokens(data: TokenData) { await writeSecureData(TOKEN_KEY, data); }
  static async getAccessToken() { return (await readSecureData<TokenData>(TOKEN_KEY))?.accessToken ?? null; }
  static async getRefreshToken() { return (await readSecureData<TokenData>(TOKEN_KEY))?.refreshToken ?? null; }
  static async removeTokens() { await deleteSecureData(TOKEN_KEY); }
}
```

```ts
// data/local/domains/app/app-storage.ts
import { readLocalData, writeLocalData } from '@/shared/services';

export class AppStorage {
  private static _appLanguage?: string;

  static saveAppLanguage(language: string) {
    AppStorage._appLanguage = language;
    writeLocalData('appLanguage', { appLanguage: language });
  }

  static getAppLanguage(): string | null {
    if (AppStorage._appLanguage) return AppStorage._appLanguage;
    const data = readLocalData<{ appLanguage: string }>('appLanguage');
    if (data?.appLanguage) {
      AppStorage._appLanguage = data.appLanguage;
      return data.appLanguage;
    }
    return null;
  }
}
```

**Rules for domain storages**:

1. **One class per domain** — `AuthStorage`, `AppStorage`, `UserStorage`.
2. **Static methods, no instances** — storage is global.
3. **Consumer-friendly API** — method names are verbs in the domain's language: `saveTokens`, `getAccessToken`, `saveOnboardingCompleted`. Never expose raw key names to callers.
4. **In-memory cache is OK** — for frequently-read values (language, flags), cache in a private static field to avoid re-reading MMKV on every call.
5. **Never use raw `createMMKV`/`SecureStore.*` in a domain storage** — always go through the shared wrappers. This keeps serialization consistent and the key surface auditable.
6. **Callers never touch the shared layer** — views/hooks/services only import domain storage classes (`AuthStorage.saveTokens(...)`), never `writeSecureData`.

## Remote API Pattern

```typescript
// data/remote/domains/workout/workout.api.ts
import { HttpService } from '@/shared/services';
import { Workout, CreateWorkoutRequest, UpdateWorkoutRequest } from './workout.types';

const getWorkouts = () => HttpService.get<Workout[]>('/workout');
const getWorkout = (id: string) => HttpService.get<Workout>(`/workout/${id}`);
const createWorkout = (data: CreateWorkoutRequest) => HttpService.post<Workout>('/workout', data);
const updateWorkout = (id: string, data: UpdateWorkoutRequest) => HttpService.put<Workout>(`/workout/${id}`, data);
const deleteWorkout = (id: string) => HttpService.delete(`/workout/${id}`);

export const WorkoutApi = {
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
};
```

## Types File Pattern

```typescript
// data/remote/domains/workout/workout.types.ts
export interface Workout {
    id: string;
    name: string;
    description: string;
    type: WorkoutType;
    exercises: WorkoutExercise[];
    createdAt: string;
    updatedAt: string;
}

export enum WorkoutType {
    STRENGTH = 'STRENGTH',
    ENDURANCE = 'ENDURANCE',
    HYBRID = 'HYBRID',
    HYROX = 'HYROX',
    CROSSFIT = 'CROSSFIT',
}

export interface CreateWorkoutRequest { name: string; description?: string; type: WorkoutType; }
export interface UpdateWorkoutRequest { name?: string; description?: string; type?: WorkoutType; }
```

## Rules — Remote

1. **API methods are thin wrappers** — no business logic, just HTTP calls
2. **Types live with their domain** — `workout.types.ts` next to `workout.api.ts`
3. **One API object per domain** — exported as `WorkoutApi`, `AuthApi`, etc.
4. **Methods use `HttpService`** — from `@/shared/services`
5. **Barrel exports** — `import { WorkoutApi, Workout } from '@/data'`
6. **No React imports** — data layer is pure TypeScript
7. **Response types match API** — keep types in sync with backend DTOs

## Anti-Patterns

- Business logic in API files — keep in state hooks or services
- Shared types scattered across files — keep per-domain
- Direct axios usage — always use the configured `HttpService`
- Transforming data in API layer — use mappers if needed (separate file)
- `createMMKV(...)` or `SecureStore.setItemAsync(...)` in screens/hooks — always go through a domain storage class
- Storing auth tokens (or anything sensitive) in MMKV — use SecureStore via `AuthStorage`
