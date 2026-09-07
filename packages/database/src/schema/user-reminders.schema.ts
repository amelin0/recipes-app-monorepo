import { relations } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, time, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { ReminderType } from '@dns/shared-types';

import { users } from './users.schema';

export const reminderTypeEnum = pgEnum('reminder_type', [
    ReminderType.Breakfast,
    ReminderType.Lunch,
    ReminderType.Dinner,
    ReminderType.Snack,
    ReminderType.WeighIn,
]);

/**
 * The five reminder cards. Rows are created at sign-up with the defaults from
 * the questionnaire, so this table — not a fallback in code — is what a
 * notification scheduler iterates over.
 *
 * The same rows back the questionnaire step and the profile screen: reminders
 * FR-006 requires that editing one shows up in the other.
 */
export const userReminders = pgTable(
    'user_reminders',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        type: reminderTypeEnum('type').notNull(),
        enabled: boolean('enabled').notNull().default(true),

        // Meals only. Local wall-clock time, not an instant: «сніданок о 8:00»
        // must stay 8:00 when the user flies somewhere else.
        timeOfDay: time('time_of_day'),

        // Weigh-in only. Days rather than an enum — the design names one
        // cadence («Кожні 2 тижні») and the spec leaves editability open, so
        // an enum would be inventing its own members.
        periodicityDays: integer('periodicity_days'),

        // Weigh-in only: the date the reminder screen shows (FR-004).
        nextFireAt: timestamp('next_fire_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [uniqueIndex('user_reminders_user_type_unique').on(table.userId, table.type)],
);

export const userRemindersRelations = relations(userReminders, ({ one }) => ({
    user: one(users, { fields: [userReminders.userId], references: [users.id] }),
}));
