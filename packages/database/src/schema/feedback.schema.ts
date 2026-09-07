import { relations } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { FeedbackStatus, FeedbackType } from '@dns/shared-types';

import { users } from './users.schema';

export const feedbackTypeEnum = pgEnum('feedback_type', [
    FeedbackType.Bug,
    FeedbackType.NotWorking,
    FeedbackType.Improvement,
    FeedbackType.FeatureRequest,
    FeedbackType.Other,
]);

export const feedbackStatusEnum = pgEnum('feedback_status', [
    FeedbackStatus.New,
    FeedbackStatus.InProgress,
    FeedbackStatus.Resolved,
]);

/**
 * Support tickets raised from the app. The client only ever creates one; the
 * admin panel will read and move them.
 */
export const feedback = pgTable(
    'feedback',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        // Nullable so a ticket outlives its author: a report about a crash
        // stays useful after the reporter deletes their account, and
        // ADR-0005 chooses to anonymise support threads rather than erase them.
        userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

        type: feedbackTypeEnum('type').notNull(),
        status: feedbackStatusEnum('status').notNull().default(FeedbackStatus.New),

        description: text('description').notNull(),

        // Up to three, held as an array of public URLs rather than a child
        // table: they are write-once, always read together, and never queried
        // individually.
        imageUrls: text('image_urls').array().notNull().default([]),

        // Optional (FR-006). Kept separate from `users.email` because the
        // reporter may want replies somewhere else — and because the ticket
        // must still carry a reply address once the account is gone.
        replyEmail: text('reply_email'),

        // App version, platform, OS — whatever the client attaches (FR-008).
        // Free-form on purpose: the spec leaves the exact set open, and a
        // fixed column set would need a migration each time it changes.
        context: jsonb('context'),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('feedback_status_created_at_idx').on(table.status, table.createdAt)],
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
    user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));
