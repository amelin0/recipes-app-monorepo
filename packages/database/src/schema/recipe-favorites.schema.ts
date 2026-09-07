import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema';
import { users } from './users.schema';

/**
 * A heart, kept per account (recipes-list FR-005).
 *
 * The composite primary key is the whole point: tapping the heart twice in a
 * flaky network must not leave two rows, and `PUT`/`DELETE` on the sub-resource
 * are idempotent because of it — which is why the route is a sub-resource and
 * not a `toggle` (ADR-0004).
 */
export const recipeFavorites = pgTable(
    'recipe_favorites',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        recipeId: uuid('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [primaryKey({ columns: [table.userId, table.recipeId] })],
);

export const recipeFavoritesRelations = relations(recipeFavorites, ({ one }) => ({
    user: one(users, { fields: [recipeFavorites.userId], references: [users.id] }),
    recipe: one(recipes, { fields: [recipeFavorites.recipeId], references: [recipes.id] }),
}));
