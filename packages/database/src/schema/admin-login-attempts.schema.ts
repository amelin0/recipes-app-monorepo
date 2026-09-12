import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { admins } from './admins.schema';

/**
 * Every attempt to sign in to the panel, successful or not (sign-in FR-009).
 *
 * Distinct from the throttler, which also counts failures: that one keeps its
 * counters in process memory and forgets everything on restart. Its job is to
 * stop the sixth attempt; this table's job is to answer «who was trying, from
 * where, and since when» a week later.
 *
 * ⚠️ This table grows on **attacker** traffic, not user traffic — a
 * brute-force run writes a row per guess. Rows older than
 * `LOGIN_ATTEMPT_RETENTION_DAYS` are pruned; without that, the journal is
 * itself a way to fill the disk.
 */
export const adminLoginAttempts = pgTable(
    'admin_login_attempts',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        // A plain string, deliberately NOT a foreign key: attempts against an
        // address that has no account are exactly the ones worth reading, and
        // an FK would make them unstorable.
        email: text('email').notNull(),

        // Set only when the address matched a real admin. SET NULL rather than
        // CASCADE: deleting an account must not erase the trail of what was
        // done to it.
        adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'set null' }),

        // text, not inet: the value comes from X-Forwarded-For, which is a
        // header a client controls and can be anything at all. Storing it in a
        // typed column would make a malformed header a 500 on the login route.
        ip: text('ip'),

        userAgent: text('user_agent'),

        // Written `false` before the password is checked and flipped on
        // success, so an attempt still in bcrypt already counts against the
        // address's lockout (sign-in FR-006). The per-address lockout reads
        // this table; see `AdminLoginAttemptRepository.openAttempt`.
        succeeded: boolean('succeeded').notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('admin_login_attempts_email_time_idx').on(table.email, table.createdAt),
        // Pruning walks this one.
        index('admin_login_attempts_time_idx').on(table.createdAt),
    ],
);

export const adminLoginAttemptsRelations = relations(adminLoginAttempts, ({ one }) => ({
    admin: one(admins, { fields: [adminLoginAttempts.adminId], references: [admins.id] }),
}));
