---
name: localization
description: Internationalization rules for the DNS mobile app using i18next + react-i18next. Covers namespace structure, the useAppTranslation hook in view/components, and rules that forbid hardcoded user-facing strings.
---

# Localization Skill

## Stack

- **i18next** + **react-i18next** — translation framework
- **MMKV** — persists the selected language (`app-prefs` storage)
- Config + barrel: [`apps/mobile/src/shared/utils/translations`](../../../../apps/mobile/src/shared/utils/translations)
- Initialized once in `src/app/_layout.tsx` via `import '@/shared/utils/translations'`

## CRITICAL: All user-facing text must be translated

Every `<Text>`, button label, placeholder, alert message, toast, header title — **any string a user can read** — must come from `t('ns:key')`. No raw English strings in screens, components, widgets, or services.

The rule applies equally to:

- Error messages in catch blocks
- Empty-state / loading-state labels
- Accessibility labels (`accessibilityLabel`)
- `placeholder` and `placeholderTextColor` on `TextInput`
- Toast / snackbar content
- Push notification copy
- Validation messages (from Zod schemas — use `z.string().min(1, t('common:validation.required'))` or a helper)

If a string is literally never shown to a user (internal logs, debug prints, test IDs), it can stay hardcoded.

## Namespace Structure

```
src/shared/utils/translations/locales/en/
├── common.json      # App-wide: actions (save/cancel), states (loading/empty), appName
├── auth.json        # Sign-in, sign-up, OTP, password reset
└── {domain}.json    # One file per domain (workout, exercise, running, nutrition, ...)
```

Add a new namespace when a domain accumulates >~10 strings. Register it:

1. Create `locales/en/{domain}.json`
2. Export it in `locales/en/index.ts`
3. Add the key to `NAMESPACES` tuple + `resources.en` map in `i18n.ts`
4. Add the key to `AppNamespace` union (derived automatically from `NAMESPACES`)

## Usage — `useAppTranslation` lives in the view

Call `useAppTranslation` **directly in `view/**/*.tsx` screens and in UI components** — inline `t('ns:key')` next to the element that renders the copy. **Never** thread translations through a screen hook. Hooks are for business logic only: state, callbacks, mutations, navigation.

```tsx
// view/auth/sign-in/SignInScreen.tsx
import { useAppTranslation } from '@/shared/utils/translations';

import { useSignInScreen } from './useSignInScreen';

export function SignInScreen() {
  const { t } = useAppTranslation(['auth', 'common']);
  const { email, setEmail, handleSubmit, isSubmitting } = useSignInScreen();

  return (
    <View className="flex-1 bg-bg-canvas px-l pt-safe">
      <Text className="text-title-lg text-content-primary">
        {t('auth:signIn.title')}
      </Text>
      <Text className="text-body-md text-content-secondary mt-xs">
        {t('auth:signIn.subtitle')}
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth:signIn.emailPlaceholder')}
      />
      <AppButton
        label={t('auth:signIn.submit')}
        onPress={handleSubmit}
        isLoading={isSubmitting}
        fullWidth
      />
    </View>
  );
}
```

```typescript
// view/auth/sign-in/useSignInScreen.ts — business logic ONLY
import { useCallback, useState } from 'react';

export function useSignInScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try { /* ... */ } finally { setIsSubmitting(false); }
  }, []);

  return { email, setEmail, isSubmitting, handleSubmit };
  //                                    ^ no `labels`, no `t`, no translations
}
```

Always namespace keys with `ns:` prefix, even within declared namespaces — it's explicit and grep-friendly.

## Shared components that render text

Reusable components (buttons, inputs, headers) stay **translation-agnostic** — they accept copy via props. The consuming screen calls `t()` and passes the string in:

```tsx
// ✅ component — no translation concerns
export function AppButton({ label, onPress }: AppButtonProps) {
  return <Pressable onPress={onPress}><Text>{label}</Text></Pressable>;
}

// ✅ screen — calls t() and forwards
<AppButton label={t('auth:signIn.submit')} onPress={handleSubmit} />
```

## Language Switching

```typescript
import { useLanguage } from '@/shared/utils/translations';

const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();

await changeLanguage('en'); // persists to MMKV automatically
```

## Interpolation & Plurals

Standard i18next syntax:

```json
{
  "workout": {
    "count": "{{count}} workout",
    "count_other": "{{count}} workouts",
    "welcome": "Welcome back, {{name}}"
  }
}
```

```tsx
<Text>{t('workout:count', { count: 1 })}</Text>         // "1 workout"
<Text>{t('workout:count', { count: 7 })}</Text>         // "7 workouts"
<Text>{t('workout:welcome', { name: user.firstName })}</Text>  // "Welcome back, Sam"
```

Keep keys **declarative** (`signIn.submit`) rather than content-descriptive (`clickHereToSignInButton`). Wording changes often; keys must not.

## Rules

1. **No hardcoded user-facing strings** — every visible string comes from `t('ns:key')`. No exceptions for "temporary" UI.
2. **`useAppTranslation` belongs in the view** — call it directly in `.tsx` screens and reusable components. Never pass translations through a screen hook.
3. **Hooks are business-logic only** — `useXScreen` returns `state`, `setters`, `callbacks`, `flags`. No `labels` object, no `t`, no translation keys.
4. **Components accept text via props** — never call `useAppTranslation` inside `shared/ui/components/**` or `shared/ui/widgets/**`. The consumer provides strings.
5. **Namespace every key** — always `ns:key` form, even for the default namespace.
6. **Keys are kebab-case at every level** — `auth:sign-in.email-label`, never `auth:signIn.emailLabel`. Applies to the top-level group, nested groups, and leaves. Aligns with folder/route/SVG naming axis. See [feedback memory](https://github.com/anthropics/claude-code — look under `~/.claude/projects/.../memory/feedback_i18n_kebab_case_keys.md`).
7. **One file per domain namespace** — don't dump everything into `common.json`.
8. **Keys stay declarative** — `sign-in.submit`, not `tap-here-to-sign-in`. English copy may change; keys must not.
9. **Pluralization via i18next** — never `count === 1 ? 'workout' : 'workouts'` in JSX.
10. **Interpolation over concatenation** — `t('greeting', { name })`, not `` `Hi, ${name}` ``.
11. **Add new namespaces formally** — register in `NAMESPACES` tuple, `resources.en`, and `locales/en/index.ts`. TypeScript prevents typos if any step is missed.
12. **Validation messages via schema** — Zod `.min(1, t('common:validation.required'))` or shared helpers — never English fallback messages.

## Anti-Patterns

```tsx
// ❌ Hardcoded strings in JSX
<Text>Welcome back</Text>
<Button title="Sign in" onPress={...} />

// ❌ camelCase keys — use kebab-case: `auth:sign-in.email-label`
t('auth:signIn.emailLabel')
t('onboarding:createProfile.birthdayPlaceholder')

// ❌ Translations returned from a hook — business logic contaminated with presentation
export function useSignInScreen() {
  const { t } = useAppTranslation(['auth']);
  return {
    email, setEmail, handleSubmit,
    labels: { title: t('auth:sign-in.title') },  // ← never do this
  };
}

// ❌ `useAppTranslation` inside a reusable component
export function AppButton({ i18nKey }: { i18nKey: string }) {
  const { t } = useAppTranslation(['common']);
  return <Pressable><Text>{t(i18nKey)}</Text></Pressable>;  // ← component should take `label`, not a key
}

// ❌ Conditional copy instead of plural key
<Text>{count} {count === 1 ? 'workout' : 'workouts'}</Text>

// ❌ String concatenation instead of interpolation
<Text>{t('common:welcome')} {user.firstName}</Text>

// ✅ Correct — `t()` inline in the view, shared component takes `label` prop,
//    plurals via i18next
<Text>{t('auth:signIn.title')}</Text>
<AppButton label={t('auth:signIn.submit')} onPress={handleSubmit} />
<Text>{t('workout:count', { count })}</Text>
```

## References

- Config: [`src/shared/utils/translations/i18n.ts`](../../../../apps/mobile/src/shared/utils/translations/i18n.ts)
- Language hook: [`src/shared/utils/translations/useLanguage.ts`](../../../../apps/mobile/src/shared/utils/translations/useLanguage.ts)
- Locales: [`src/shared/utils/translations/locales/en/`](../../../../apps/mobile/src/shared/utils/translations/locales/en)
- Canonical example: [`view/auth/sign-in/SignInScreen.tsx`](../../../../apps/mobile/src/view/auth/sign-in/SignInScreen.tsx) + [`useSignInScreen.ts`](../../../../apps/mobile/src/view/auth/sign-in/useSignInScreen.ts)
