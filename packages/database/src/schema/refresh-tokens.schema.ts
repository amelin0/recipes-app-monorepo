import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * One row per issued refresh token. Rows are not deleted on rotation — the
 * spent one stays with `rotatedAt` set so a replay can be told apart from an
 * unknown token, which is what makes theft detectable (ADR-0003).
 *
 * The row id travels in the JWT as `jti`, so a refresh costs one indexed
 * lookup plus one bcrypt compare instead of scanning every row of the user.
 */
export const refreshTokens = pgTable(
    'refresh_tokens',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        // Constant across every rotation of one device's chain. Revoking a
        // compromised chain means deleting this family, which is exactly the
        // scope session/spec.md FR-006 requires: other devices keep working.
        familyId: uuid('family_id').notNull(),

        // bcrypt of the whole token. Redundant against a database leak alone —
        // the signature is the secret and never lands here — but it is what
        // stops a *forged* token when the refresh secret has also leaked: the
        // attacker's freshly minted JWT will not match this hash.
        tokenHash: text('token_hash').notNull(),

        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

        // Set the moment the token is exchanged — by a conditional UPDATE
        // (`WHERE rotated_at IS NULL`), so of two refreshes racing on one
        // token exactly one rotates it. A token presented after this is a
        // replay and the whole family is revoked, unless the grace below
        // still applies.
        rotatedAt: timestamp('rotated_at', { withTimezone: true }),

        // Set when a second refresh of this token, arriving within the grace
        // window after `rotatedAt`, was given a sibling pair instead of being
        // treated as a replay — the mobile app fires two refreshes at once.
        // Claimed by a conditional UPDATE too, so the grace is used ONCE per
        // rotated token: a third presentation is a replay whatever its timing.
        graceUsedAt: timestamp('grace_used_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('refresh_tokens_user_id_idx').on(table.userId),
        index('refresh_tokens_family_id_idx').on(table.familyId),
    ],
);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));
