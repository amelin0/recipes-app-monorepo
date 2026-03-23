---
name: naming-conventions
description: Defines consistent naming patterns across the codebase — file names, folders, components, hooks, slices, API files, types, and mappers.
---

# Naming Conventions Skill

## Purpose
Defines consistent naming patterns across the codebase.

---

## Folder Naming

**Always `kebab-case`:**

```
✅ sign-in/
✅ user-profile/
✅ forgot-password/

❌ SignIn/
❌ signIn/
❌ sign_in/
```

---

## File Naming

### React Components (`.tsx`)

**`PascalCase` with descriptive suffix:**

```
✅ SignInScreen.tsx       # Screen
✅ HomeScreen.tsx
✅ Button.tsx             # Component
✅ UserCard.tsx           # Widget
✅ LoginForm.tsx          # Feature component

❌ signInScreen.tsx
❌ sign-in-screen.tsx
```

### Zustand Slices

**`domain.slice.ts` pattern:**

```
✅ auth.slice.ts
✅ user.slice.ts
✅ cart.slice.ts

❌ authSlice.ts
❌ AuthSlice.ts
```

### React Query Hooks

**`useCamelCase.ts` pattern:**

```
✅ useGetUser.ts
✅ useGetUsers.ts
✅ useSignIn.ts
✅ useUpdateProfile.ts
✅ useDeleteAccount.ts

❌ use-get-user.ts
❌ usegetuser.ts
```

### API Files

**`domain.type.ts` pattern:**

```
✅ auth.api.ts
✅ auth.types.ts
✅ auth.mapper.ts       # optional, only when transformation needed
✅ user.api.ts
✅ user.types.ts

❌ auth.dto.ts           # don't use .dto.ts
❌ AuthApi.ts
❌ auth-api.ts
```

### Services & Helpers

**`name.type.ts` pattern:**

```
✅ http.service.ts
✅ storage.service.ts
✅ query-client.service.ts

✅ number.helper.ts
✅ date.helper.ts
✅ string.helper.ts

✅ validation.util.ts
```

### Screen Hooks

**`useScreenName.ts` pattern:**

```
✅ useSignInScreen.ts
✅ useHomeScreen.ts
✅ useProfileScreen.ts
✅ useCheckoutScreen.ts

❌ useSignIn.ts            # too generic, conflicts with RQ hooks
❌ useSignInScreenHook.ts  # redundant suffix
```

### Types

**`name.types.ts` pattern:**

```
✅ auth.types.ts
✅ user.types.ts
✅ navigation.types.ts
```

### Selectors

**`name.selectors.ts` pattern:**

```
✅ auth.selectors.ts
✅ user.selectors.ts
```

### Storage

**`domain.storage.ts` pattern:**

```
✅ auth.storage.ts
✅ settings.storage.ts
```

---

## Naming Inside Files

### Interfaces & Types

```typescript
// Domain models — clean names (usable in components)
interface Profile { }
interface Token { }
interface EmailVerification { }

// Request types — suffixed (API-layer only)
interface SendOtpEmailRequest { }
interface SetPinRequest { }

// Mapped models — only when mapper transforms shape
interface UserProfile { }       // has computed fullName, Date fields
interface AuthTokens { }        // flattened from nested Token objects

// Type aliases
type AuthState = { }
type UserRole = 'admin' | 'user'

// Props interfaces
interface ButtonProps { }
interface UserCardProps { }
```

### Zustand Slice Interface

```typescript
// Always ends with 'Slice'
export interface AuthSlice { }
export interface UserSlice { }

// Actions end with 'Action'
switchAuthenticatedAction: (value: boolean) => void
setAccessTokenAction: (token: string) => void
logoutAction: () => void
```

### React Query Hooks

```typescript
// Queries: useGet*, useList*, useFetch*
export const useGetUser = () => { }
export const useGetUsers = () => { }
export const useListOrders = () => { }

// Mutations: useCreate*, useUpdate*, useDelete*, use[Action]*
export const useCreateUser = () => { }
export const useUpdateUser = () => { }
export const useDeleteUser = () => { }
export const useSignIn = () => { }
export const useSignUp = () => { }
```

### Functions & Variables

```typescript
// camelCase
const getUserById = () => { }
const isAuthenticated = true
const userList = []

// Handlers: handle*
const handlePress = () => { }
const handleSubmit = () => { }
```

### Constants

```typescript
// UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_COUNT = 3

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth/access_token',
  USER: '@auth/user',
}
```

### Enums

```typescript
// PascalCase
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
}

enum HttpStatus {
  Ok = 200,
  NotFound = 404,
}
```

---

## Summary Table

| Type | Pattern | Example |
|------|---------|---------|
| Folders | `kebab-case` | `sign-in/` |
| Screens | `PascalCaseScreen.tsx` | `SignInScreen.tsx` |
| Components | `PascalCase.tsx` | `Button.tsx` |
| Widgets | `PascalCase.tsx` | `UserCard.tsx` |
| Slices | `domain.slice.ts` | `auth.slice.ts` |
| RQ Hooks | `useCamelCase.ts` | `useGetUser.ts` |
| API | `domain.api.ts` | `auth.api.ts` |
| Types | `domain.types.ts` | `auth.types.ts` |
| Mappers | `domain.mapper.ts` | `auth.mapper.ts` (optional) |
| Services | `name.service.ts` | `http.service.ts` |
| Helpers | `name.helper.ts` | `date.helper.ts` |
| Screen Hooks | `useScreenName.ts` | `useSignInScreen.ts` |
| Types | `name.types.ts` | `auth.types.ts` |
| Selectors | `name.selectors.ts` | `auth.selectors.ts` |
| Storage | `domain.storage.ts` | `auth.storage.ts` |

---

## Barrel Exports

Each domain folder should have `index.ts`:

```typescript
// src/state/domains/auth/index.ts
export { createAuthSlice } from './auth.slice';
export type { AuthSlice } from './auth.slice';
export * from './hooks';

// src/state/domains/auth/hooks/index.ts
export { useSignIn } from './useSignIn';
export { useSignUp } from './useSignUp';
export { useGetCurrentUser } from './useGetCurrentUser';

// src/shared/ui/components/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Text } from './Text';
```
