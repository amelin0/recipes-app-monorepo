import { relations } from 'drizzle-orm';
import { date, index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * One glass of water. A log of entries rather than a running total on the day,
 * so a mis-tap can be taken back — an increment-only counter would need a
 * separate undo concept to do the same thing.
 */
export const waterLogEntries = pgTable(
    'water_log_entries',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        logDate: date('log_date').notNull(),

        // Always millilitres regardless of the user's chosen unit: the store
        // keeps one canonical scale and the app converts for display.
        amountMl: integer('amount_ml').notNull(),

        loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('water_log_entries_user_date_idx').on(table.userId, table.logDate)],
);

export const waterLogEntriesRelations = relations(waterLogEntries, ({ one }) => ({
    user: one(users, { fields: [waterLogEntries.userId], references: [users.id] }),
}));
