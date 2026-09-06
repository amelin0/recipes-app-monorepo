import { relations } from 'drizzle-orm';
import { date, index, numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { BodyMetric } from '@dns/shared-types';

import { users } from './users.schema';

export const bodyMetricEnum = pgEnum('body_metric', [BodyMetric.Weight, BodyMetric.Waist, BodyMetric.Height]);

/**
 * Readings the user takes now and then: weight, waist, height.
 *
 * One table for all three rather than one per metric — they differ only in
 * their unit and allowed range, and a per-metric table would triple every
 * query the progress screen makes to answer the same question.
 *
 * The daily metrics the same screen shows (calories, water, steps) are
 * deliberately absent: those are already summed from the nutrition logs, and
 * copying them here would create a second number that can disagree with the
 * first.
 */
export const bodyMeasurements = pgTable(
    'body_measurements',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        metric: bodyMetricEnum('metric').notNull(),

        // Canonical units always — kilograms and centimetres — whatever the
        // user reads them in. The same rule the questionnaire follows, and for
        // the same reason: a chart must not change shape when a display
        // preference does.
        value: numeric('value', { precision: 6, scale: 2 }).notNull(),

        // The day the reading belongs to, named by the client: someone
        // weighing themselves at 00:30 means that morning, not the previous
        // day, and only the device knows the timezone.
        measuredOn: date('measured_on').notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('body_measurements_user_metric_date_idx').on(table.userId, table.metric, table.measuredOn)],
);

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
    user: one(users, { fields: [bodyMeasurements.userId], references: [users.id] }),
}));
