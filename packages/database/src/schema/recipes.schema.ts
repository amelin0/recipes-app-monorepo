import { relations } from 'drizzle-orm';
import { index, integer, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { cuisines } from './cuisines.schema';
import { dishCategories } from './dish-categories.schema';
import { contentSourceEnum } from './products.schema';
import { users } from './users.schema';

/**
 * A dish — ours or the user's own.
 *
 * **The nutrition numbers are stored, not derived from the composition.**
 * Catalogue recipes arrive from an authored import with their own figures, and
 * some of their ingredients still carry no macros at all (ADR-0006, open
 * question); deriving on read would silently understate exactly those dishes.
 * A user's own dish gets the same columns filled by the server from its
 * composition at write time — computed once, then held still, the same rule
 * the meal log follows.
 *
 * The figures cover **the whole dish**. Per serving is `total / servings`,
 * which is what the card, the calorie filter and the portion sheet all use;
 * storing both would be one fact in two places.
 */
export const recipes = pgTable(
    'recipes',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        source: contentSourceEnum('source').notNull(),

        categoryId: uuid('category_id').references(() => dishCategories.id, { onDelete: 'set null' }),

        // Exactly one. The detail screen names a single cuisine and the
        // create-dish sheet picks a single one; the filter's multi-select is
        // «Italian OR Greek», which a column answers as well as a join table
        // would (ADR-0006, resolved 2026-09-07).
        cuisineId: uuid('cuisine_id').references(() => cuisines.id, { onDelete: 'set null' }),

        photoUrl: text('photo_url'),

        cookTimeMinutes: integer('cook_time_minutes'),

        servings: integer('servings').notNull().default(1),
        totalWeightG: numeric('total_weight_g', { precision: 8, scale: 2 }),

        calories: integer('calories').notNull(),
        proteinG: numeric('protein_g', { precision: 7, scale: 2 }).notNull(),
        fatsG: numeric('fats_g', { precision: 7, scale: 2 }).notNull(),
        carbsG: numeric('carbs_g', { precision: 7, scale: 2 }).notNull(),

        // Set only on a user's own dish, and it dies with the account: unlike a
        // custom product, an own recipe is never pulled into anybody else's.
        createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('recipes_source_creator_idx').on(table.source, table.createdBy),
        index('recipes_category_idx').on(table.categoryId),
        index('recipes_cuisine_idx').on(table.cuisineId),
    ],
);

export const recipeTranslations = pgTable(
    'recipe_translations',
    {
        recipeId: uuid('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        title: text('title').notNull(),
    },
    table => [
        primaryKey({ columns: [table.recipeId, table.language] }),
        index('recipe_translations_language_idx').on(table.language),
    ],
);

export const recipesRelations = relations(recipes, ({ one, many }) => ({
    category: one(dishCategories, { fields: [recipes.categoryId], references: [dishCategories.id] }),
    cuisine: one(cuisines, { fields: [recipes.cuisineId], references: [cuisines.id] }),
    creator: one(users, { fields: [recipes.createdBy], references: [users.id] }),
    translations: many(recipeTranslations),
}));

export const recipeTranslationsRelations = relations(recipeTranslations, ({ one }) => ({
    recipe: one(recipes, { fields: [recipeTranslations.recipeId], references: [recipes.id] }),
}));
