import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { admins } from './admins.schema';

/**
 * One row per issued admin refresh token — the staff mirror of
 * `refresh_tokens`.
 *
 * A separate table rather than a nullable `admin_id` on the client one: that
 * column would have to be nullable, which means every query touching sessions
 * would need to remember which world it is in, and the FK from `users` could
 * no longer be NOT NULL. Two tables cost one file and remove the question.
 *
 * Rows are not deleted on rotation — the spent one stays with `rotatedAt` set,
 * so a replay is distinguishable from an unknown token, which is what makes
 * theft detectable (ADR-0003, sign-in FR-012).
 */
export const adminRefreshTokens = pgTable(
    'admin_refresh_tokens',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        adminId: uuid('admin_id')
            .notNull()
            .references(() => admins.id, { onDelete: 'cascade' }),

        // Constant across every rotation of one browser's chain. Revoking a
        // compromised chain deletes this family and leaves the admin's other
        // browsers signed in.
        familyId: uuid('family_id').notNull(),

        // bcrypt of the whole token. Redundant against a database leak alone —
        // the signature is the secret and never lands here — but it is what
        // stops a *forged* token if the refresh secret also leaked: the
        // attacker's freshly minted JWT will not match this digest.
        tokenHash: text('token_hash').notNull(),

        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

        rotatedAt: timestamp('rotated_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('admin_refresh_tokens_admin_id_idx').on(table.adminId),
        index('admin_refresh_tokens_family_id_idx').on(table.familyId),
    ],
);

export const adminRefreshTokensRelations = relations(adminRefreshTokens, ({ one }) => ({
    admin: one(admins, { fields: [adminRefreshTokens.adminId], references: [admins.id] }),
}));
