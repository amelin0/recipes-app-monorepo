import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * The eleven dish categories the catalog rail, the search grid and the filter
 * screen all draw from (recipes-list FR-002).
 *
 * A table rather than an enum in code, for the same reason all four filter
 * dictionaries are tables: a recipe points at a row, thousands of recipes point
 * at the same row, and adding a twelfth category should not require shipping a
 * new build of two apps. The rows arrive with the migration, so a fresh
 * database is never missing the ones the design names.
 *
 * `emoji` is what the filter chip shows; `imageUrl` is the illustration the
 * rail and the search grid show. Both belong to the category, not to the
 * screen — otherwise two clients would each carry their own copy of eleven
 * pictures.
 */
export const dishCategories = pgTable('dish_categories', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Stable across renames and translations: what code, seeds and the admin
    // panel refer to when they mean «desserts».
    slug: text('slug').notNull().unique(),

    emoji: text('emoji'),
    imageUrl: text('image_url'),

    // The design fixes the order (savoury breakfasts first, baking last), and
    // alphabetical order differs per language — so it is stored, not derived.
    sortOrder: integer('sort_order').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dishCategoryTranslations = pgTable(
    'dish_category_translations',
    {
        categoryId: uuid('category_id')
            .notNull()
            .references(() => dishCategories.id, { onDelete: 'cascade' }),

        // Text, not an enum, matching `user_settings.language`: the supported
        // set changes with content rather than with a migration.
        language: text('language').notNull(),

        name: text('name').notNull(),
    },
    table => [primaryKey({ columns: [table.categoryId, table.language] })],
);

export const dishCategoriesRelations = relations(dishCategories, ({ many }) => ({
    translations: many(dishCategoryTranslations),
}));

export const dishCategoryTranslationsRelations = relations(dishCategoryTranslations, ({ one }) => ({
    category: one(dishCategories, {
        fields: [dishCategoryTranslations.categoryId],
        references: [dishCategories.id],
    }),
}));
