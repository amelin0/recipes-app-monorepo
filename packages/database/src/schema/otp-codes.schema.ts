import { relations } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { OtpPurpose } from '@dns/shared-types';

import { users } from './users.schema';

export const otpPurposeEnum = pgEnum('otp_purpose', [OtpPurpose.EmailVerification, OtpPurpose.PasswordReset]);

/**
 * One-time 6-digit codes. Email verification and password reset are the same
 * entity with a different purpose — both specs describe identical mechanics
 * (expiry, single use, attempt counter) and differ only in what consuming the
 * code grants.
 *
 * Issuing a new code deletes the previous unconsumed one for the same
 * (user, purpose): sign-up FR-006 and password-reset FR-006 both require a
 * resend to invalidate its predecessor.
 */
export const otpCodes = pgTable(
    'otp_codes',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        purpose: otpPurposeEnum('purpose').notNull(),

        // bcrypt, not a fast digest: a 6-digit space is 10^6, so a leaked
        // table of SHA-256 codes would be reversed instantly.
        codeHash: text('code_hash').notNull(),

        // Counts failed guesses. At the cap (see AUTH_POLICY) the code is spent
        // whether or not it was ever entered correctly — sign-up FR-005.
        attempts: integer('attempts').notNull().default(0),

        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        consumedAt: timestamp('consumed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('otp_codes_user_id_purpose_idx').on(table.userId, table.purpose)],
);

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
    user: one(users, { fields: [otpCodes.userId], references: [users.id] }),
}));
