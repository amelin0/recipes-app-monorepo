import { relations } from 'drizzle-orm';
import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * The one active daily goal. One row per account, replaced wholesale on save —
 * goal-setup's Out of Scope excludes a change history, so there is nothing to
 * keep versions for.
 *
 * No row until the user saves a goal: the tracking screen shows a call to
 * action rather than rings, and inventing a default would put numbers in front
 * of somebody who never chose them.
 */
export const nutritionGoals = pgTable('nutrition_goals', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),

    dailyCalories: integer('daily_calories').notNull(),
    dailyProteinG: integer('daily_protein_g').notNull(),
    dailyFatsG: integer('daily_fats_g').notNull(),
    dailyCarbsG: integer('daily_carbs_g').notNull(),
    dailyWaterMl: integer('daily_water_ml').notNull(),
    dailyFiberG: integer('daily_fiber_g').notNull(),

    // Has no configuration screen yet (daily-tracking FR-010 shows the target
    // but nothing sets it), so it is written with a default and can be changed
    // the moment a screen appears — no migration needed for that.
    dailyStepsTarget: integer('daily_steps_target').notNull(),

    // What the formulas suggested when this goal was saved (ADR-0007).
    // A snapshot, not a live value: it exists so «how far did the user move
    // from the recommendation» has a fixed thing to compare against, and a
    // fresh recommendation shifts with every weight change. Null for a goal
    // saved before the profile held enough to compute one.
    recommendedCalories: integer('recommended_calories'),
    recommendedWaterMl: integer('recommended_water_ml'),
    recommendedSteps: integer('recommended_steps'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const nutritionGoalsRelations = relations(nutritionGoals, ({ one }) => ({
    user: one(users, { fields: [nutritionGoals.userId], references: [users.id] }),
}));
