import { relations } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { NotificationEvent, NotificationType } from '@dns/shared-types';

import { users } from './users.schema';

export const notificationTypeEnum = pgEnum('notification_type', [
    NotificationType.Reminder,
    NotificationType.System,
    NotificationType.Subscription,
]);

/** Why the message exists. See the enum for what is produced and what is only declared. */
export const notificationEventEnum = pgEnum('notification_event', [
    NotificationEvent.SubscriptionActivated,
    NotificationEvent.SubscriptionCancelled,
    NotificationEvent.ReferralRedeemed,
    NotificationEvent.AccountDeletionRequested,
    NotificationEvent.AccountDeletionCancelled,
    NotificationEvent.ProductVerified,
    NotificationEvent.Promo,
    NotificationEvent.DailyLogReminder,
    NotificationEvent.WaterReminder,
    NotificationEvent.Inactivity,
    NotificationEvent.SubscriptionExpiring,
    NotificationEvent.SubscriptionExpired,
    // Appended, not placed beside `referral_redeemed`: a value added at the
    // end is a plain `ADD VALUE`, one in the middle needs `BEFORE`, and the
    // order here means nothing to anybody reading the column.
    NotificationEvent.ReferralRewarded,
]);

/**
 * Something the app said while nobody was looking.
 *
 * **The text is stored, not built on read.** A notification is a record of
 * what was sent — including by push, where the wording left the building the
 * moment it was delivered. Rebuilding it later from a template would let the
 * inbox and the push notification say different things about the same event.
 *
 * That also settles the language: a notification is written in the language
 * the account read in when it was created, and stays in it. There is no
 * translation table here for the same reason there is none on a receipt.
 */
export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        type: notificationTypeEnum('type').notNull(),

        /**
         * The event that produced this row.
         *
         * Nullable, and deliberately: rows written before producers existed
         * have no honest value to put here, and inventing one would make the
         * column lie about where they came from. Everything written from now on
         * carries it.
         */
        event: notificationEventEnum('event'),

        title: text('title').notNull(),
        body: text('body').notNull(),

        /** Only the fuller kinds carry these (inbox FR-005). */
        subtitle: text('subtitle'),

        /**
         * The bullet list a system message can carry. JSON because it is part
         * of the message rather than data anybody queries — a table of rows
         * nothing ever joins against is a table for its own sake.
         */
        items: jsonb('items').$type<string[]>(),

        /** «Розмір файлу: 42.5 MB» — a line of chrome under the text. */
        metaLabel: text('meta_label'),

        /** The single action at the foot of the card; both or neither. */
        actionLabel: text('action_label'),
        actionRoute: text('action_route'),

        readAt: timestamp('read_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('notifications_user_created_idx').on(table.userId, table.createdAt),
        /**
         * For the retention sweep, which asks «older than» across every
         * account. The index above cannot answer that: `user_id` leads, and
         * Postgres 16 has no skip scan, so without this one every nightly
         * batch — including the last, empty one — reads the whole table.
         */
        index('notifications_created_idx').on(table.createdAt),
    ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
