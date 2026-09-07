import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { diets } from './diets.schema';
import { recipes } from './recipes.schema';

/** Which dietary labels a dish carries. Many per dish, unlike cuisine. */
export const recipeDiets = pgTable(
    'recipe_diets',
    {
        recipeId: uuid('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),

        dietId: uuid('diet_id')
            .notNull()
            .references(() => diets.id, { onDelete: 'cascade' }),
    },
    table => [
        primaryKey({ columns: [table.recipeId, table.dietId] }),
        // The filter asks «which dishes are vegan», the reverse of the PK.
        index('recipe_diets_diet_idx').on(table.dietId),
    ],
);

export const recipeDietsRelations = relations(recipeDiets, ({ one }) => ({
    recipe: one(recipes, { fields: [recipeDiets.recipeId], references: [recipes.id] }),
    diet: one(diets, { fields: [recipeDiets.dietId], references: [diets.id] }),
}));
