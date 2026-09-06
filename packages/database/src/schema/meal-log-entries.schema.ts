import { relations } from 'drizzle-orm';
import { date, index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { MealSlot } from '@dns/shared-types';

import { users } from './users.schema';

export const mealSlotEnum = pgEnum('meal_slot', [MealSlot.Breakfast, MealSlot.Lunch, MealSlot.Dinner, MealSlot.Snack]);

/**
 * One eaten dish, filed against a day and a slot.
 *
 * The credited numbers are a **snapshot**, not a reference. A recipe can be
 * edited afterwards — a user's own dish especially — and the confirmation
 * screen is a receipt of what was true when the meal was logged
 * (meal-logging FR-006). Recomputing on read would silently rewrite history.
 *
 * That snapshot is also what lets this ship before the recipe domain exists:
 * `recipeId` stays null until there is a table to point at, and the entry is
 * complete without it.
 */
export const mealLogEntries = pgTable(
    'meal_log_entries',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        // The day this counts toward, in the user's own calendar — not derived
        // from `loggedAt`, because a meal at 01:00 belongs to the night before
        // for the person eating it.
        logDate: date('log_date').notNull(),

        slot: mealSlotEnum('slot').notNull(),

        // Filled once the recipe domain exists; the FK is added with it.
        recipeId: uuid('recipe_id'),

        // Snapshot of what was eaten, so the entry reads correctly forever.
        dishName: text('dish_name').notNull(),

        portions: integer('portions').notNull(),

        // How much of those portions the user actually ate. Everything not
        // eaten was eaten by somebody else and must not reach the stats
        // (meal-details FR-008).
        eatenFraction: numeric('eaten_fraction', { precision: 4, scale: 3 }).notNull(),

        creditedCalories: integer('credited_calories').notNull(),
        creditedProteinG: numeric('credited_protein_g', { precision: 7, scale: 2 }).notNull(),
        creditedFatsG: numeric('credited_fats_g', { precision: 7, scale: 2 }).notNull(),
        creditedCarbsG: numeric('credited_carbs_g', { precision: 7, scale: 2 }).notNull(),
        creditedWeightG: numeric('credited_weight_g', { precision: 8, scale: 2 }).notNull(),

        // The whole cooked dish including the portions made for others
        // (meal-logging FR-005) — display only, never credited.
        totalWeightG: numeric('total_weight_g', { precision: 8, scale: 2 }).notNull(),

        loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('meal_log_entries_user_date_idx').on(table.userId, table.logDate)],
);

export const mealLogEntriesRelations = relations(mealLogEntries, ({ one }) => ({
    user: one(users, { fields: [mealLogEntries.userId], references: [users.id] }),
}));
