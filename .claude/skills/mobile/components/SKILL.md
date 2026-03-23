---
name: components
description: Patterns for creating React Native components styled with Uniwind (className). Covers simple reusable components like Button, Input, Header, and their prop interfaces.
---

# Components Skill

## Purpose

Defines patterns for creating React Native components styled with Uniwind (`className`).

---

## Styling Rule

**All components use Uniwind `className` for styling.** No `StyleSheet.create()`, no inline `style` objects, no separate `.styles.ts` files. Design tokens are defined in `src/global.css` and referenced via Tailwind utility classes.

Exceptions: Reanimated animated styles, gesture-driven values, or third-party libraries that strictly require style objects.

---

## Component Types

### 1. Screen Components (`view/[domain]/`)

Full-page components that represent screens. **Every screen has a dedicated `useScreenName.ts` hook** that encapsulates all logic. The screen component itself is purely presentational.

#### Screen Hook (`useScreenName.ts`)

Contains ALL screen logic: state, mutations, navigation, translations, computed values.

```typescript
// src/view/auth/sign-in/useSignInScreen.ts
import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';
import { useSignInEmail, useSendOtpEmail } from '@/state/domains/auth/hooks';

export const useSignInScreen = () => {
  const { t } = useAppTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');

  const { signInEmail, isPending: isSignInPending } = useSignInEmail();
  const { sendOtpEmail, isPending: isSendOtpPending } = useSendOtpEmail();

  const isLoading = isSignInPending || isSendOtpPending;

  const handleContinue = useCallback(async () => {
    if (!email.trim()) return;
    try {
      await signInEmail({ email: email.trim() });
    } catch {
      try {
        await sendOtpEmail({ email: email.trim() });
      } catch {
        // Handle error
      }
    }
  }, [email, signInEmail, sendOtpEmail]);

  const handleContactSupport = useCallback(() => {
    // Navigate to support
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleAppleAuth = useCallback(() => {
    // Apple OAuth
  }, []);

  const handleGoogleAuth = useCallback(() => {
    // Google OAuth
  }, []);

  return {
    email,
    setEmail,
    isLoading,
    isDisabled: !email.trim(),
    handleContinue,
    handleContactSupport,
    handleBack,
    handleAppleAuth,
    handleGoogleAuth,
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

#### Screen Component (presentational)

Destructures the hook return and renders JSX. **No logic inside.**

```typescript
// src/view/auth/sign-in/SignInScreen.tsx
import React from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, SocialButton } from '@/shared/ui/components';
import { Input } from '@/shared/ui/components/inputs';
import { Header } from '@/shared/ui/headers';
import { useSignInScreen } from './useSignInScreen';

export const SignInScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    email,
    setEmail,
    isLoading,
    isDisabled,
    handleContinue,
    handleContactSupport,
    handleBack,
    handleAppleAuth,
    handleGoogleAuth,
  } = useSignInScreen();

  return (
    <View className="flex-1 bg-bg-primary" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header, form, buttons — all purely presentational */}
      </KeyboardAvoidingView>
    </View>
  );
};
```

#### File Structure

```
view/auth/sign-in/
├── SignInScreen.tsx        # Presentational — renders JSX
├── useSignInScreen.ts     # All logic — state, handlers, navigation
└── components/            # Screen-specific sub-components
    └── LoginForm.tsx
```

**Rules:**

- Named with `Screen` suffix
- **Every screen has a `useScreenName.ts` hook** — no exceptions
- Screen component is **purely presentational** — only destructures hook + renders
- No `useState`, `useCallback`, `useMutation`, `useQuery` directly in screens
- Screen hooks consume domain hooks from `state/domains/`
- Located in `view/[domain]/[screen-name]/`
- No separate `.styles.ts` files — use `className` directly

---

### 2. Simple Components (`shared/ui/components/`)

Stateless, highly reusable, atomic components organized by category.

#### Folder Structure

```
shared/ui/components/
├── buttons/
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── LinkButton.tsx
│   └── index.ts
├── inputs/
│   ├── Input.tsx
│   ├── TextArea.tsx
│   ├── Checkbox.tsx
│   ├── Switch.tsx
│   └── index.ts
├── layouts/
│   ├── Container.tsx
│   ├── Row.tsx
│   ├── Column.tsx
│   ├── Spacer.tsx
│   └── index.ts
├── toasts/
│   ├── Toast.tsx
│   ├── ToastContainer.tsx
│   └── index.ts
├── modals/
│   ├── Modal.tsx
│   ├── BottomSheet.tsx
│   ├── AlertDialog.tsx
│   └── index.ts
├── Text.tsx
├── Avatar.tsx
├── Icon.tsx
├── Badge.tsx
└── index.ts
```

#### Example: Input Component

```typescript
// src/shared/ui/components/inputs/Input.tsx
import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <View className="mb-lg">
      {label && (
        <Text className="text-sm font-figtree-medium text-content-primary mb-xs">
          {label}
        </Text>
      )}
      <TextInput
        className={`h-12 border rounded-sm px-lg text-base text-content-primary bg-field-bg ${
          error ? 'border-error' : 'border-field-border'
        } focus:border-brand-primary ${className}`}
        placeholderTextColorClassName="accent-content-tertiary"
        {...props}
      />
      {error && (
        <Text className="text-xs text-error mt-xxs">{error}</Text>
      )}
    </View>
  );
};
```

#### Example: Button Component

```typescript
// src/shared/ui/components/buttons/Button.tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

const sizeClasses = {
  small: 'py-xs px-sm',
  medium: 'py-md px-lg',
  large: 'py-lg px-xl',
} as const;

const variantClasses = {
  primary: 'bg-button-primary active:opacity-80',
  secondary: 'bg-bg-secondary active:opacity-80',
  outline: 'border border-brand-primary active:bg-brand-light',
  ghost: 'active:bg-bg-tertiary',
} as const;

const textClasses = {
  primary: 'text-button-primary-content',
  secondary: 'text-content-primary',
  outline: 'text-brand-primary',
  ghost: 'text-content-primary',
} as const;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  isLoading = false,
  className = '',
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`rounded-xl items-center ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator colorClassName="accent-button-primary-content" />
      ) : (
        <Text className={`font-figtree-semibold ${textClasses[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
};
```

**Characteristics:**

- Self-contained with `className` styling
- Props interface for type safety
- Accept optional `className` prop for parent overrides
- No business logic
- No external state dependencies
- Reusable across entire app
- Organized by category in subfolders

---

### 3. Widget Components (`shared/ui/widgets/`)

Composed from multiple components, may have UI logic (not domain-specific). Typically include a BottomSheetModal or other complex interaction patterns.

#### Current Widgets

| Widget | Description |
|--------|-------------|
| `DatePicker/` | Day/month/year pickers with BottomSheet selectors |
| `PhoneInput/` | Phone number input with country code picker (BottomSheet) |
| `SelectCountryDropdown` | Country selector with search and flag icons |
| `DocumentTypeDropdown` | Document type selector dropdown |
| `SwipableStackList` | Swipable stacked card list |

#### Folder Structure

Widgets with multiple files use a folder with barrel export:

```
shared/ui/widgets/
├── DatePicker/
│   ├── DatePicker.tsx
│   ├── MonthBottomSheet.tsx
│   └── index.ts
├── PhoneInput/
│   ├── PhoneInput.tsx
│   ├── phone-countries.ts
│   └── index.ts
├── DocumentTypeDropdown.tsx
├── SelectCountryDropdown.tsx
├── SwipableStackList.tsx
└── index.ts
```

**Characteristics:**

- Composed from `components/`
- May have internal state (UI only, e.g. search, open/close)
- Often include `BottomSheetModal` for selection UIs
- Logic is generic, not domain-specific
- More complex than atomic components
- Use `BaseBottomSheet` from `components/bottom-sheets` when possible

---

### 4. Feature Components (`view/[domain]/[screen]/components/`)

Screen-specific components that are not reusable outside that screen.

```typescript
// src/view/auth/sign-in/components/LoginForm.tsx
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';

import { Input, Button, Text } from '@/shared/ui/components';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = useCallback(() => {
    onSubmit(email, password);
  }, [email, password, onSubmit]);

  return (
    <View className="gap-md">
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      {error && <Text className="text-sm text-error">{error}</Text>}
      <Button
        title="Sign In"
        onPress={handleSubmit}
        isLoading={isLoading}
        className="mt-md"
      />
    </View>
  );
};
```

**Characteristics:**

- Specific to one screen
- Located in screen's `components/` folder
- Uses shared components and widgets

---

## Component Structure

### File Organization

```
view/auth/sign-in/
├── SignInScreen.tsx
└── components/
    ├── LoginForm.tsx
    └── SocialButtons.tsx

shared/ui/
├── components/
│   ├── bottom-sheets/
│   │   ├── BaseBottomSheet.tsx
│   │   └── index.ts
│   ├── buttons/
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── SelectButton.tsx
│   │   ├── SlideButton.tsx
│   │   ├── SocialButton.tsx
│   │   └── index.ts
│   ├── common/
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── InfoBlock.tsx
│   │   ├── QrCode.tsx
│   │   └── index.ts
│   ├── headers/
│   │   ├── Header.tsx
│   │   ├── ProfileHeader.tsx
│   │   ├── StepHeader.tsx
│   │   └── index.ts
│   ├── icon/
│   │   ├── AppIcon.tsx
│   │   ├── FlagIcon.tsx
│   │   └── index.ts
│   ├── inputs/
│   │   ├── CopyField.tsx
│   │   ├── Input.tsx
│   │   ├── OtpInput.tsx
│   │   ├── PinDots.tsx
│   │   ├── PinKeyboard.tsx
│   │   ├── Radio.tsx
│   │   ├── RadioButton.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── AlertModal.tsx
│   │   └── index.ts
│   ├── navigation/
│   │   ├── TabBar.tsx
│   │   └── index.ts
│   ├── toasts/
│   │   ├── Snackbar.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   └── styled/
└── widgets/
    ├── DatePicker/
    ├── PhoneInput/
    ├── DocumentTypeDropdown.tsx
    ├── SelectCountryDropdown.tsx
    ├── SwipableStackList.tsx
    └── index.ts
```

**Note:** No separate `.styles.ts` files. All styling lives in `className` props directly in the component.

---

## Best Practices

### Props Interface

```typescript
// Good — accept optional className for parent overrides
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}
```

### Default Props

```typescript
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
}) => { ... }
```

### Memoization

```typescript
import { memo } from 'react';

export const UserCard = memo<UserCardProps>(({ user, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-lg bg-bg-primary rounded-xl ios:shadow-sm android:elevation-2"
    >
      <Avatar source={user.avatar} className="w-12 h-12 rounded-full" />
      <View className="flex-1 ml-md">
        <Text className="text-base font-figtree-semibold text-content-primary">{user.name}</Text>
        <Text className="text-sm text-content-secondary">{user.email}</Text>
      </View>
    </Pressable>
  );
});

UserCard.displayName = 'UserCard';
```

### Third-Party Component Wrapping

```typescript
// shared/ui/components/styled.ts
import { withUniwind } from 'uniwind';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

export const StyledBlurView = withUniwind(BlurView);
export const StyledSafeAreaView = withUniwind(SafeAreaView);
```
