---
name: localization
description: Patterns for translating user-facing text using i18next + react-i18next with namespace-based translation files. Covers useAppTranslation hook and labels pattern.
---

# Localization Skill

## Purpose

Defines patterns for translating all user-facing text using i18next + react-i18next with namespace-based translation files.

---

## Setup

| Item | Detail |
|------|--------|
| Library | `i18next` + `react-i18next` |
| Config | `src/shared/utils/translations/i18n.ts` |
| Hook | `useAppTranslation` (from `@/shared/utils/translations`) |
| Locale files | `src/shared/utils/translations/locales/{lang}/{namespace}.json` |
| Supported languages | `en` (English) — more can be added |
| Namespaces | `common`, `auth` (add more as domains grow) |

---

## Rules

1. **No hardcoded strings in screens.** Every user-visible text must come from a translation key.
2. **`useAppTranslation` lives in the screen hook** (`useScreenName.ts`), never in the screen component.
3. **Screen components are presentational** — they receive translated strings via the hook's return (typically a `labels` object).
4. **Use existing keys first.** Check `common.json` and the relevant domain namespace before creating new keys.
5. **Create new keys** in the appropriate namespace JSON when no existing key fits.
6. **Namespace convention:** `common` for shared text (buttons, actions, status), domain namespace for domain-specific text (e.g., `auth` for sign-in/sign-up).

---

## Translation Files

```
src/shared/utils/translations/
├── i18n.ts                    # Config + useAppTranslation hook
├── useLanguage.ts             # Language switching helper
├── index.ts                   # Barrel export
└── locales/
    └── en/
        ├── common.json        # Shared: "Save", "Cancel", "Continue", "Loading..."
        ├── auth.json          # Auth: "Sign In", "Email", "Enter your email address"
        └── index.ts           # Barrel: export { default as common } from './common.json'
```

### Adding a New Namespace

1. Create `src/shared/utils/translations/locales/en/{namespace}.json`
2. Export it in `locales/en/index.ts`
3. Add namespace to the `ns` array in `i18n.ts`
4. Add resources under `resources.en.{namespace}` in `i18n.ts`

---

## Usage Pattern

### Screen Hook (all translations here)

```typescript
// src/view/auth/sign-in/useSignInScreen.ts
import { useAppTranslation } from '@/shared/utils/translations';

export const useSignInScreen = () => {
  const { t } = useAppTranslation(['auth', 'common']);

  // ... state, handlers, domain hooks ...

  return {
    // ... state, handlers ...
    labels: {
      title: t('auth:emailTitle'),
      subtitle: t('auth:emailSubtitle'),
      placeholder: t('auth:emailPlaceholder'),
      continueButton: t('common:continue'),
      orContinueWith: t('auth:orContinueWith'),
      contactSupport: t('auth:contactSupport'),
    },
  };
};
```

### Screen Component (uses labels from hook)

```typescript
// src/view/auth/sign-in/SignInScreen.tsx
export const SignInScreen: React.FC = () => {
  const { labels, ...rest } = useSignInScreen();

  return (
    <View>
      <Text>{labels.title}</Text>
      <Text>{labels.subtitle}</Text>
      <Input placeholder={labels.placeholder} />
      <Button title={labels.continueButton} />
    </View>
  );
};
```

### Key Format

Use `namespace:keyName` format with `t()`:

```typescript
t('common:save')        // "Save"
t('common:cancel')      // "Cancel"
t('auth:signIn')        // "Sign In"
t('auth:emailTitle')    // "Email"
```

### Interpolation

```json
{ "greeting": "Hello, {{name}}!" }
```

```typescript
t('common:greeting', { name: 'John' }) // "Hello, John!"
```

---

## Key Naming Conventions

| Pattern | Example | Use for |
|---------|---------|---------|
| `noun` | `"email": "Email"` | Labels, field names |
| `nounVerb` | `"signIn": "Sign In"` | Action labels |
| `nounTitle` | `"emailTitle": "Email"` | Screen/section titles |
| `nounSubtitle` | `"emailSubtitle": "Enter your email address"` | Descriptions |
| `nounPlaceholder` | `"emailPlaceholder": "Email"` | Input placeholders |
| `verbNoun` | `"forgotPassword": "Forgot password?"` | Links, questions |

---

## Checklist for New Screens

1. Identify all user-visible text in the screen
2. Check existing keys in `common.json` and domain namespace
3. Add missing keys to the appropriate namespace JSON
4. Import `useAppTranslation` in the screen hook
5. Pass namespaces array: `useAppTranslation(['domain', 'common'])`
6. Return a `labels` object from the hook with all translated strings
7. Screen component uses `labels.*` — no `t()` calls in the component
