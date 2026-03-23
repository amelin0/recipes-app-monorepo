---
name: data-layer
description: Patterns for API communication, types, optional mappers, and local storage. Covers domain.api.ts, domain.types.ts, domain.mapper.ts files and Axios HTTP service.
---

# Data Layer Skill

## Purpose

Defines patterns for API communication, types, optional mappers, and local storage.

---

## Structure

```
data/
├── remote/
│   └── domains/
│       ├── auth/
│       │   ├── auth.api.ts
│       │   ├── auth.types.ts
│       │   ├── auth.mapper.ts   ← optional
│       │   └── index.ts
│       └── user/
│           ├── user.api.ts
│           ├── user.types.ts
│           └── index.ts
├── local/
│   └── domains/
│       ├── auth/
│       │   ├── auth-storage.ts
│       │   └── index.ts
│       └── app/
│           ├── app-storage.ts
│           └── index.ts
└── index.ts
```

**Note:** HTTP client and storage service are in `shared/services/`.

---

## Remote Data (API)

### Types File (`.types.ts`)

Single source of truth for all domain types. Used by API layer **and** components.

**Naming conventions:**

| Kind | Suffix | Example | Used in |
|------|--------|---------|---------|
| Request types | `Request` | `SendOtpEmailRequest` | API layer only |
| Domain models | Clean name | `Profile`, `Token` | Everywhere (components, hooks, etc.) |
| Enums / unions | Clean name | `UserStatus`, `KycStatus` | Everywhere |
| API wrapper | `ApiResponse<T>` | `ApiResponse<Profile>` | API layer only |

```typescript
// src/data/remote/domains/auth/auth.types.ts

// Enums
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

// Shared
export interface ApiResponse<T> {
  statusCode: number;
  meta: Record<string, unknown>;
  payload: T;
}

export interface Token {
  value: string;
  exp: number;
}

// Domain models — clean names, usable in components
export interface Profile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Request types — suffixed, API-layer only
export interface SendOtpEmailRequest {
  email: string;
}

// Response types — clean descriptive names
export interface EmailVerification {
  email: string;
  temporaryToken: string;
  registrationStatus: RegistrationStatus;
}

export interface AuthSession {
  user: Profile;
  accessToken: Token;
  refreshToken: Token;
}
```

---

### API File (`.api.ts`)

API files contain endpoint calls using `HttpService` from shared.

```typescript
// src/data/remote/domains/auth/auth.api.ts
import { HttpService } from '@/shared/services';

import {
  ApiResponse,
  AuthSession,
  EmailVerification,
  SendOtpEmailRequest,
  OtpResult,
  VerifyEmailOtpRequest
} from './auth.types';

const ENDPOINTS = {
  OTP_EMAIL: '/users/auth/otp/email',
  OTP_EMAIL_VERIFY: '/users/auth/otp/email/verify',
  PIN_VERIFY: '/users/auth/pin/verify'
};

export const AuthApi = {
  sendOtpEmail: (data: SendOtpEmailRequest) => {
    return HttpService.post<ApiResponse<OtpResult>>(ENDPOINTS.OTP_EMAIL, data);
  },

  verifyEmailOtp: (data: VerifyEmailOtpRequest) => {
    return HttpService.post<ApiResponse<EmailVerification>>(ENDPOINTS.OTP_EMAIL_VERIFY, data);
  },

  verifyPin: (data: VerifyPinRequest) => {
    return HttpService.post<ApiResponse<AuthSession>>(ENDPOINTS.PIN_VERIFY, data);
  }
};
```

---

### Mapper File (`.mapper.ts`) — OPTIONAL

**Only create a mapper when there is actual transformation:**
- Restructuring nested objects (e.g. flattening `Token` → flat strings)
- Computing derived fields (e.g. `fullName` from `firstName` + `lastName`)
- Converting types (e.g. date string → `Date` object)
- Renaming fields (e.g. `countryCode` → `code`)

**Do NOT create a mapper for 1:1 copies.** If the API response is already the shape you need, use the types directly.

```typescript
// src/data/remote/domains/auth/auth.mapper.ts
import { AuthSession, EnabledCountries, EnabledCountry, Profile, Token } from './auth.types';

// Mapped domain models (different shape from API types)
export interface AuthTokens {
  accessToken: string;
  accessTokenExp: number;
  refreshToken: string;
  refreshTokenExp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;        // ← computed
  createdAt: Date;          // ← converted from string
  updatedAt: Date;          // ← converted from string
}

export interface AuthResult {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface CountryOption {
  code: string;             // ← renamed from countryCode
  name: string;             // ← renamed from countryName
}

export const authMapper = {
  toTokens: (accessToken: Token, refreshToken: Token): AuthTokens => ({
    accessToken: accessToken.value,
    accessTokenExp: accessToken.exp,
    refreshToken: refreshToken.value,
    refreshTokenExp: refreshToken.exp
  }),

  toUserProfile: (dto: Profile): UserProfile => ({
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    fullName: [dto.firstName, dto.lastName].filter(Boolean).join(' '),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
  }),

  toAuthResult: (dto: AuthSession): AuthResult => ({
    user: authMapper.toUserProfile(dto.user),
    tokens: authMapper.toTokens(dto.accessToken, dto.refreshToken)
  }),

  toCountryOptions: (dto: EnabledCountries): CountryOption[] =>
    dto.countries.map(c => ({ code: c.countryCode, name: c.countryName }))
};
```

---

### Barrel Export

```typescript
// src/data/remote/domains/auth/index.ts
export { AuthApi } from './auth.api';
export * from './auth.types';

// Only if mapper exists
export { authMapper } from './auth.mapper';
export type { AuthResult, AuthTokens, CountryOption, UserProfile } from './auth.mapper';

// src/data/index.ts
export * from './remote/domains/auth';
export * from './remote/domains/user';
```

---

## Local Data (Storage)

Storage instances use services from `shared/services/`.

```typescript
// src/data/local/domains/auth/auth-storage.ts
import { deleteData, readData, writeData } from '@/shared/services';

export class AuthStorage {
  static token: string;

  static async saveTokens(data: any) {
    AuthStorage.token = data.accessToken;
    await writeData('token', data);
  }

  static async getAccessToken() {
    if (AuthStorage.token) {
      return AuthStorage.token;
    }

    const t = await readData<any>('token');
    if (t?.accessToken) {
      AuthStorage.token = t.accessToken;
    }

    return t ? t.accessToken : null;
  }

  static async removeTokens() {
    AuthStorage.token = '';
    await deleteData('token');
  }
}
```

---

## File Naming Conventions

### File Names (kebab-case with suffix)

| Pattern               | Example            | Purpose                          |
| --------------------- | ------------------ | -------------------------------- |
| `[domain].api.ts`     | `auth.api.ts`      | API endpoint calls               |
| `[domain].types.ts`   | `auth.types.ts`    | All types (request + domain)     |
| `[domain].mapper.ts`  | `auth.mapper.ts`   | Transformation (optional)        |
| `[domain]-storage.ts` | `auth-storage.ts`  | Local storage operations         |

### Export Names (PascalCase)

```typescript
// File: auth.api.ts → Export: AuthApi
export const AuthApi = { ... };

// File: auth.mapper.ts → Export: authMapper
export const authMapper = { ... };

// File: auth-storage.ts → Export: AuthStorage
export class AuthStorage { ... }
```

### Usage Example

```typescript
import { AuthApi, Profile, SendOtpEmailRequest } from '@/data';
import { authMapper, UserProfile } from '@/data';
import { AuthStorage } from '@/data/local/domains/auth';
import { HttpService } from '@/shared/services';
```

---

## Decision: Types vs Mapper

```
API returns camelCase and shape is usable as-is?
  → Use types directly. No mapper needed.

API returns snake_case, or nested structure needs flattening,
or you need computed fields (fullName, Date conversion)?
  → Create a mapper. Mapped models live in the mapper file.
```

---

## Summary

| File             | Purpose                        | Required |
| ---------------- | ------------------------------ | -------- |
| `*.api.ts`       | API calls                      | Yes      |
| `*.types.ts`     | All types (request + domain)   | Yes      |
| `*.mapper.ts`    | Transformation to domain model | Optional |
| `*-storage.ts`   | Local storage operations       | Yes      |
