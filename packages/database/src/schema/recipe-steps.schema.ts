import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema';

/**
 * One numbered step of the method (meal-details FR-005).
 *
 * The step's own text is translated; its number and duration are not, so they
 * stay here and the words go next door — the same split every other content
 * table in this domain uses.
 *
 * There is no per-step ingredient list yet: the current detail design prints
 * the dish's ingredients once above the steps. The create-dish editor does
 * offer per-step chips, and that is what will add the join table — building it
 * now would mean shipping a table nothing reads.
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

export const recipeStepsRelations = relations(recipeSteps, ({ one, many }) => ({
    recipe: one(recipes, { fields: [recipeSteps.recipeId], references: [recipes.id] }),
    translations: many(recipeStepTranslations),
}));

export const recipeStepTranslationsRelations = relations(recipeStepTranslations, ({ one }) => ({
    step: one(recipeSteps, { fields: [recipeStepTranslations.stepId], references: [recipeSteps.id] }),
}));
