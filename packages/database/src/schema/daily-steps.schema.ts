import { relations } from 'drizzle-orm';
import { date, integer, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * Steps walked on a day. One replaceable value, not a log: there is no "log a
 * step" action anywhere in the product — the count arrives as a running total,
 * whether typed in or synced from the device, and each report supersedes the
 * last. Making it additive would double-count on the second sync of the day.
 */
export const dailySteps = pgTable(
    'daily_steps',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        logDate: date('log_date').notNull(),

        steps: integer('steps').notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [primaryKey({ columns: [table.userId, table.logDate] })],
);

export const dailyStepsRelations = relations(dailySteps, ({ one }) => ({
    user: one(users, { fields: [dailySteps.userId], references: [users.id] }),
}));
