import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * The coarse bucket a product falls into — vegetables, fruit, meat, fish,
 * sweets, dairy, flour, grains.
 *
 * The group hangs off the **product**, not the recipe: filtering a recipe by
 * «fish» means «one of its ingredients is a fish», and that answer already
 * lives in the ingredient list. A second copy on the recipe would be a fact
 * derivable from the first, free to disagree with it.
 *
 * **Two screens read this table and want different things from it.** The
 * recipe filter offers exactly six options (recipe-filters FR-002); the
 * shopping list groups by seven, two of which the filter has never heard of
 * (weekly-list FR-001). Rather than a second taxonomy — which somebody would
 * have to keep in step for every product, and which would drift — the table
 * carries which groups the filter shows and the order each screen wants.
 */
export const productGroups = pgTable('product_groups', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    emoji: text('emoji'),

    /** Order on the recipe filter screen. */
    sortOrder: integer('sort_order').notNull(),

    /** Order on the shopping list, which starts with meat rather than vegetables. */
    shoppingSortOrder: integer('shopping_sort_order').notNull().default(0),

    /** Flour and grains are shopping-list aisles, not recipe filter options. */
    isRecipeFilter: boolean('is_recipe_filter').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const productGroupTranslations = pgTable(
    'product_group_translations',
    {
        groupId: uuid('group_id')
            .notNull()
            .references(() => productGroups.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        name: text('name').notNull(),
    },
    table => [primaryKey({ columns: [table.groupId, table.language] })],
);

export const productGroupsRelations = relations(productGroups, ({ many }) => ({
    translations: many(productGroupTranslations),
}));

export const productGroupTranslationsRelations = relations(productGroupTranslations, ({ one }) => ({
    group: one(productGroups, { fields: [productGroupTranslations.groupId], references: [productGroups.id] }),
}));
