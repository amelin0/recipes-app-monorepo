import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * The short-lived, single-use right to change one account's password, issued
 * once the reset code checks out (password-reset FR-003). Deliberately not a
 * session: it grants exactly one operation and nothing else.
 *
 * The row exists only so the permit can be spent — a self-contained JWT could
 * be replayed until it expired, and FR-010 requires the flow to be a dead end
 * once used.
 */
export const passwordResetPermits = pgTable(
    'password_reset_permits',
    {
        // Travels in the permit JWT as `jti`.
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        consumedAt: timestamp('consumed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('password_reset_permits_user_id_idx').on(table.userId)],
);

export const passwordResetPermitsRelations = relations(passwordResetPermits, ({ one }) => ({
    user: one(users, { fields: [passwordResetPermits.userId], references: [users.id] }),
}));
