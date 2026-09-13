/**
 * Auth DTOs — hand-written from the live OpenAPI document
 * (https://dev.api.client.rationfit.com/docs-json, tag `auth`).
 *
 * Not generated: the spec documents the payload WITHOUT the `{ data }`
 * envelope the API actually sends, and every nullable field is emitted as
 * `object` instead of its real type. `HttpService` strips the envelope, so
 * these describe what a call site receives.
 */

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

/** Register takes the same pair; the account starts unverified. */
export type RegisterPayload = LoginPayload;

export interface VerifyEmailPayload {
    email: string;
    /** 6-digit code from the email. */
    code: string;
}

export interface ResendCodePayload {
    email: string;
}

export interface RequestPasswordResetPayload {
    email: string;
}

export interface VerifyPasswordResetPayload {
    email: string;
    code: string;
}

/** The verify step trades a code for a short-lived permit. */
export interface PasswordResetPermit {
    permitToken: string;
}

export interface SetNewPasswordPayload {
    permitToken: string;
    password: string;
    passwordConfirmation: string;
}

export interface OAuthSignInPayload {
    provider: 'apple' | 'google';
    idToken: string;
}

export interface CurrentUser {
    id: string;
    email: string;
    /** ISO timestamp, or null while the address is unconfirmed. */
    emailVerifiedAt: string | null;
    /** ISO timestamp while a deletion request is pending, else null. */
    deletionScheduledFor: string | null;
}
