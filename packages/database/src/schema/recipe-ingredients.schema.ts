import { relations } from 'drizzle-orm';
import { index, integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';

import { products } from './products.schema';
import { recipes } from './recipes.schema';

/**
 * What goes into a dish, and how much of it.
 *
 * **Grams, and only grams.** Every screen that shows an ingredient shows a
 * weight (meal-details FR-004, create-dish FR-001), and the macro sum ADR-0006
 * defines is `Σ(per_100g × amount_g / 100)`. A `unit` column carried over from
 * V1 would let «1 cup» into the table — a row whose macros nobody can compute,
 * sitting in a dish whose totals must nevertheless add up.
 */
export const recipeIngredients = pgTable(
    'recipe_ingredients',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        recipeId: uuid('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),

        // Restricted rather than cascading: removing a product that dishes are
        // built from should fail loudly, not quietly hollow them out.
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'restrict' }),

        amountG: numeric('amount_g', { precision: 8, scale: 2 }).notNull(),

        sortOrder: integer('sort_order').notNull().default(0),
    },
    table => [
        index('recipe_ingredients_recipe_idx').on(table.recipeId),
        // The «contains chicken» filter walks this the other way round.
        index('recipe_ingredients_product_idx').on(table.productId),
    ],
);

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
    recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
    product: one(products, { fields: [recipeIngredients.productId], references: [products.id] }),
}));
