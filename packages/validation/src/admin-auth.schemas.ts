import { z } from 'zod';

import { ADMIN_AUTH_POLICY } from '@dns/constants';

import { emailSchema, passwordSchema } from './auth.schemas';

/**
 * Staff sign-in. Shares `emailSchema` with the client so normalisation to
 * lower case happens in exactly one place — the unique index on `admins.email`
 * is on the raw column, and the whole case-insensitive scheme rests on nothing
 * ever reaching the database un-normalised.
 */
export const adminLoginSchema = z.object({
    email: emailSchema,
    // Deliberately not `passwordSchema`: an account may hold a password that
    // predates the current policy, and rejecting it here would lock its owner
    // out with a validation error instead of letting them in to change it.
    // The upper bound stays, because bcrypt silently ignores past 72 bytes.
    password: z
        .string()
        .min(1, 'Password is required')
        .refine(
            value => Buffer.byteLength(value, 'utf8') <= ADMIN_AUTH_POLICY.passwordMaxBytes,
            `Password must be at most ${ADMIN_AUTH_POLICY.passwordMaxBytes} bytes`,
        ),
});

export const adminRefreshSchema = z.object({
    refreshToken: z.string().trim().min(1, 'Refresh token is required'),
});

/**
 * Provisioning a new staff account — used by the seed and, later, by
 * SUPER_ADMIN. Here the full password policy DOES apply: this is where a
 * password is chosen, so there is no legacy value to be lenient about.
 */
export const createAdminSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().trim().min(1, 'Name is required').max(120),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRefreshInput = z.infer<typeof adminRefreshSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
