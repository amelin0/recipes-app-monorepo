import { relations } from 'drizzle-orm';
import { index, integer, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { recipeIngredients } from './recipe-ingredients.schema';
import { recipes } from './recipes.schema';

/**
 * One numbered step of the method (meal-details FR-005).
 *
 * The step's own text is translated; its number and duration are not, so they
 * stay here and the words go next door — the same split every other content
 * table in this domain uses.
 */
export const recipeSteps = pgTable(
    'recipe_steps',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        recipeId: uuid('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),

        stepNumber: integer('step_number').notNull(),

        durationMinutes: integer('duration_minutes'),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [unique('recipe_steps_recipe_number_key').on(table.recipeId, table.stepNumber)],
);

export const recipeStepTranslations = pgTable(
    'recipe_step_translations',
    {
        stepId: uuid('step_id')
            .notNull()
            .references(() => recipeSteps.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        title: text('title').notNull(),
        description: text('description'),
    },
    table => [primaryKey({ columns: [table.stepId, table.language] })],
);

/**
 * Which of the dish's ingredients a step needs — the chips in the step editor
 * (create-dish FR-007).
 *
 * It points at `recipe_ingredients`, not at `products`: the chip means «the
 * 200 g of carrot from this dish», and pointing at the product would lose the
 * amount and quietly survive the ingredient being removed from the dish.
 */
export const recipeStepIngredients = pgTable(
    'recipe_step_ingredients',
    {
        stepId: uuid('step_id')
            .notNull()
            .references(() => recipeSteps.id, { onDelete: 'cascade' }),

        recipeIngredientId: uuid('ingredient_id')
            .notNull()
            .references(() => recipeIngredients.id, { onDelete: 'cascade' }),
    },
    table => [
        primaryKey({ columns: [table.stepId, table.recipeIngredientId] }),
        index('recipe_step_ingredients_ingredient_idx').on(table.recipeIngredientId),
    ],
);

export const recipeStepsRelations = relations(recipeSteps, ({ one, many }) => ({
    recipe: one(recipes, { fields: [recipeSteps.recipeId], references: [recipes.id] }),
    translations: many(recipeStepTranslations),
    ingredients: many(recipeStepIngredients),
}));

export const recipeStepIngredientsRelations = relations(recipeStepIngredients, ({ one }) => ({
    step: one(recipeSteps, { fields: [recipeStepIngredients.stepId], references: [recipeSteps.id] }),
    ingredient: one(recipeIngredients, {
        fields: [recipeStepIngredients.recipeIngredientId],
        references: [recipeIngredients.id],
    }),
}));

export const recipeStepTranslationsRelations = relations(recipeStepTranslations, ({ one }) => ({
    step: one(recipeSteps, { fields: [recipeStepTranslations.stepId], references: [recipeSteps.id] }),
}));
