import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * The thirteen dietary labels a recipe can carry (recipe-filters FR-002).
 *
 * Unlike cuisine, this one is many-per-recipe: a dish is plausibly vegan and
 * gluten-free and low-calorie at once. The join table is `recipe_diets`.
 */
export const diets = pgTable('diets', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    emoji: text('emoji'),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dietTranslations = pgTable(
    'diet_translations',
    {
        dietId: uuid('diet_id')
            .notNull()
            .references(() => diets.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        name: text('name').notNull(),
    },
    table => [primaryKey({ columns: [table.dietId, table.language] })],
);

export const dietsRelations = relations(diets, ({ many }) => ({
    translations: many(dietTranslations),
}));

export const dietTranslationsRelations = relations(dietTranslations, ({ one }) => ({
    diet: one(diets, { fields: [dietTranslations.dietId], references: [diets.id] }),
}));
