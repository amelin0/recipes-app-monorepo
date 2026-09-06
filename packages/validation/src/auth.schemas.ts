import { z } from 'zod';

import { AUTH_POLICY } from '@dns/constants';
import { OAuthProvider } from '@dns/shared-types';

/**
 * Addresses are compared case-insensitively (sign-up FR-001), which is
 * implemented by normalising here — every route that accepts an email goes
 * through this schema, so the database only ever sees the lower-cased form.
 */
export const emailSchema = z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .transform(value => value.toLowerCase());

/**
 * Sign-up shows no confirmation field (FR-002), so the message has to name the
 * specific rule that failed — the user cannot diff two boxes to find the typo.
 */
export const passwordSchema = z
    .string()
    .min(AUTH_POLICY.password.minLength, `Password must be at least ${AUTH_POLICY.password.minLength} characters`)
    .refine(
        value => Buffer.byteLength(value, 'utf8') <= AUTH_POLICY.password.maxBytes,
        `Password must be at most ${AUTH_POLICY.password.maxBytes} bytes`,
    )
    .refine(
        value => AUTH_POLICY.password.pattern.test(value),
        'Password must contain at least one letter and one digit',
    );

export const otpCodeSchema = z
    .string()
    .trim()
    .regex(new RegExp(`^\d{${AUTH_POLICY.otp.length}}$`), `Code must be ${AUTH_POLICY.otp.length} digits`);

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export const verifyEmailSchema = z.object({
    email: emailSchema,
    code: otpCodeSchema,
});

export const resendEmailCodeSchema = z.object({
    email: emailSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    // Deliberately not `passwordSchema`: an existing account may hold a
    // password that predates the current policy, and rejecting it at the door
    // would lock the owner out with a validation error instead of letting them
    // sign in (or reset).
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const requestPasswordResetSchema = z.object({
    email: emailSchema,
});

export const verifyPasswordResetCodeSchema = z.object({
    email: emailSchema,
    code: otpCodeSchema,
});

/** The reset form does have a confirmation field (password-reset FR-004). */
export const setNewPasswordSchema = z
    .object({
        permitToken: z.string().min(1, 'Permit token is required'),
        password: passwordSchema,
        passwordConfirmation: z.string(),
    })
    .refine(value => value.password === value.passwordConfirmation, {
        path: ['passwordConfirmation'],
        message: 'Passwords do not match',
    });

export const oauthSignInSchema = z.object({
    provider: z.nativeEnum(OAuthProvider),
    /** The provider's ID token; the server verifies it against the provider. */
    idToken: z.string().min(1, 'Provider token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendEmailCodeInput = z.infer<typeof resendEmailCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type VerifyPasswordResetCodeInput = z.infer<typeof verifyPasswordResetCodeSchema>;
export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>;
export type OAuthSignInInput = z.infer<typeof oauthSignInSchema>;
