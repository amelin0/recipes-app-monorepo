import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * The six coarse buckets a product falls into — vegetables, fruit, meat, fish,
 * sweets, dairy (recipe-filters FR-002, group «Продукти»).
 *
 * The group hangs off the **product**, not the recipe: filtering a recipe by
 * «fish» means «one of its ingredients is a fish», and that answer already
 * lives in the ingredient list. A second copy on the recipe would be a fact
 * derivable from the first, free to disagree with it.
 */
export const productGroups = pgTable('product_groups', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    emoji: text('emoji'),
    sortOrder: integer('sort_order').notNull(),
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
