import { relations, sql } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { OtpPurpose } from '@dns/shared-types';

import { users } from './users.schema';

export const otpPurposeEnum = pgEnum('otp_purpose', [OtpPurpose.EmailVerification, OtpPurpose.PasswordReset]);

/**
 * One-time 6-digit codes. Email verification and password reset are the same
 * entity with a different purpose — both specs describe identical mechanics
 * (expiry, single use, attempt counter) and differ only in what consuming the
 * code grants.
 *
 * At most one unconsumed code per (user, purpose) — a partial unique index,
 * not a convention. Sign-up FR-006 and password-reset FR-006 both require a
 * resend to invalidate its predecessor, and issuing is an upsert against that
 * index, so two resends landing together replace one row instead of leaving
 * two live codes (and twice the guesses).
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

        // Counts checks, reserved BEFORE the comparison runs: a guess takes a
        // slot with a conditional UPDATE (`attempts < max`) and only then
        // compares. Once the cap is reached the code is spent whether or not
        // it was ever entered correctly — sign-up FR-005.
        attempts: integer('attempts').notNull().default(0),

        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        consumedAt: timestamp('consumed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('otp_codes_user_id_purpose_idx').on(table.userId, table.purpose),
        uniqueIndex('otp_codes_one_live_per_purpose')
            .on(table.userId, table.purpose)
            .where(sql`${table.consumedAt} is null`),
    ],
);

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
    user: one(users, { fields: [otpCodes.userId], references: [users.id] }),
}));
