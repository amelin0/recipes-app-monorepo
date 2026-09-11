import { relations, sql } from 'drizzle-orm';
import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * A request to delete the account, honoured after a grace period
 * (account-deletion FR-001, FR-002).
 *
 * A table rather than a column pair on `users` because the spec's entity has
 * a history — a request can be cancelled and a later one raised — and because
 * the row carries the scheduled moment a cleanup job will act on.
 *
 * State is derived, never stored: active means neither `cancelledAt` nor
 * `executedAt` is set. A `state` column would be a second source of truth that
 * can disagree with the timestamps.
 */
export const accountDeletionRequests = pgTable(
    'account_deletion_requests',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        // When the grace period ends and the account may be erased.
        scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),

        cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
        executedAt: timestamp('executed_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        // The history lookup: every request an account ever raised, and the
        // path `ON DELETE CASCADE` takes when the user row goes.
        index('account_deletion_requests_user_id_idx').on(table.userId),
        // At most one request counting down per account, enforced by the
        // database. A check in the service could not hold it: two taps in
        // flight both see «nothing pending» and both insert, and cancelling
        // then stops only one of them — the other would still erase the
        // account the user had just taken back.
        uniqueIndex('account_deletion_requests_one_active_per_user')
            .on(table.userId)
            .where(sql`${table.cancelledAt} is null and ${table.executedAt} is null`),
    ],
);

export const accountDeletionRequestsRelations = relations(accountDeletionRequests, ({ one }) => ({
    user: one(users, { fields: [accountDeletionRequests.userId], references: [users.id] }),
}));
