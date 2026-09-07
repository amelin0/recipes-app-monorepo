import { relations } from 'drizzle-orm';
import { date, index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { mealSlotEnum } from './meal-log-entries.schema';
import { recipes } from './recipes.schema';
import { users } from './users.schema';

/**
 * A dish someone intends to cook on a given day, in a given slot.
 *
 * **A reference, not a snapshot — the opposite of `meal_log_entries`.** A log
 * entry is a receipt of what was eaten and must read correctly forever, so it
 * copies the numbers. A plan item is an intention about a dish that still
 * exists: if the recipe is edited the plan should follow it, and if the recipe
 * is deleted there is nothing left to cook. Hence the foreign key, and hence
 * the cascade.
 *
 * One item means one serving. The picker adds a dish with a single tap and
 * asks for no quantity (meal-plan FR-010), so a portions column would be a
 * number no screen collects.
 */
export const mealPlanItems = pgTable(
    'meal_plan_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        // The day in the user's own calendar, named by the client — the same
        // rule the meal log follows, and for the same reason.
        planDate: date('plan_date').notNull(),

        slot: mealSlotEnum('slot').notNull(),

        recipeId: uuid('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),

        // Within its slot: the order the picker added them in.
        sortOrder: integer('sort_order').notNull().default(0),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('meal_plan_items_user_date_idx').on(table.userId, table.planDate)],
);

export const mealPlanItemsRelations = relations(mealPlanItems, ({ one }) => ({
    user: one(users, { fields: [mealPlanItems.userId], references: [users.id] }),
    recipe: one(recipes, { fields: [mealPlanItems.recipeId], references: [recipes.id] }),
}));
