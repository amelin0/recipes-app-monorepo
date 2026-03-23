---
name: screens
description: Catalog of all screens in the app organized by domain. Covers screen hook pattern (useScreenName), presentational screen components, and Expo Router integration.
---

# Screens Skill

## Purpose

Catalog of all screens in the app, organized by domain.

---

## Screen Conventions

- Every screen: `ScreenName.tsx` + `useScreenName.ts` hook
- Screen is purely presentational — no `useState`, `useCallback`, `useQuery` directly
- Hook returns `labels` object with all translated strings
- Screen-specific sub-components go in `components/` subfolder
- Screens with `Header` component use `pt-xs` (12px) padding top for consistency

---

## Auth Domain (`view/auth/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `SignInScreen` | `(auth)/sign-in` | Email input + social auth buttons |
| `EmailOtpScreen` | `(auth)/email-otp` | Email OTP verification |
| `PhoneOtpScreen` | `(auth)/phone-otp` | Phone OTP verification |
| `OnboardingScreen` | `(auth)/onboarding` | Welcome carousel/slides |
| `CreatePasscodeScreen` | `(auth)/create-passcode` | PIN creation |
| `EnterPinScreen` | `(auth)/enter-pin` | PIN entry for login |
| `ResetPinScreen` | `(auth)/reset-pin` | PIN reset flow |

---

## KYC Domain (`view/kyc/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `SelectResidenceCountryScreen` | `(onboarding)/select-residence-country` | Country selection with form + Zod validation |
| `PersonalInformationScreen` | `(onboarding)/personal-information` | Name/surname form |
| `SelectBirthdayScreen` | `(onboarding)/select-birthday` | Date of birth via `DatePicker` widget |
| `VerifyPhoneScreen` | `(onboarding)/verify-phone` | Phone input via `PhoneInput` widget |
| `KycVerificationScreen` | `(onboarding)/kyc-verification` | Document upload (ID, selfie) |
| `KycStatusScreen` | `(onboarding)/kyc-status` | Verification status display |

---

## User Domain (`view/user/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `ProfileScreen` | `(tabs)/profile` | Main profile tab |
| `ProfileInfoScreen` | `(app)/profile-info` | View/edit profile details |
| `AccountAlmostReadyScreen` | `(app)/account-almost-ready` | Onboarding checklist |
| `BiometricScreen` | `(app)/biometric` | Biometric auth setup |
| `ChangePinScreen` | `(change-pin)/change-pin` | Current PIN entry |
| `VerifyChangePinScreen` | `(change-pin)/verify-change-pin` | New PIN confirmation |

---

## Transactions Domain (`view/transactions/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `TransactionsScreen` | `(tabs)/transactions` | Transaction history list |
| `SendScreen` | `(transactions)/send` | Send money flow |
| `ReceivePaymentScreen` | `(transactions)/receive-payment` | QR code + share for receiving |
| `ScanQRScreen` | `(transactions)/scan-qr` | QR code scanner |
| `ConvertScreen` | `(transactions)/convert` | Currency conversion |
| `TopUpScreen` | `(transactions)/top-up` | Top up wallet |

---

## Wallets Domain (`view/wallets/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `WalletsScreen` | `(tabs)/index` | Home tab — wallet slider + actions |

---

## Notifications Domain (`view/notifications/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `NotificationsScreen` | `(app)/notifications` | Notification list |
| `NotificationDetailsScreen` | `(app)/notification-details` | Single notification detail |
| `ActivityScreen` | `(app)/activity` | Activity feed |

---

## Recipients Domain (`view/recipients/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `RecipientsScreen` | `(app)/recipients` | Saved recipients list |

---

## System Domain (`view/system/`)

| Screen | Route | Description |
|--------|-------|-------------|
| `AnimatedSplashScreen` | — | Animated splash on app launch |
| `MaintenanceScreen` | — | Server maintenance notice |
| `UpdateAppScreen` | — | Force update prompt |
