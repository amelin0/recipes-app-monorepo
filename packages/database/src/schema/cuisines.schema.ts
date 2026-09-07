import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Where a dish comes from — one of six in the filter and in the create-dish
 * sheet (recipe-filters FR-002, create-dish FR-001).
 *
 * Same shape as the other three dictionaries; see `dish-categories.schema.ts`
 * for why they are tables.
 */
export const cuisines = pgTable('cuisines', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    emoji: text('emoji'),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cuisineTranslations = pgTable(
    'cuisine_translations',
    {
        cuisineId: uuid('cuisine_id')
            .notNull()
            .references(() => cuisines.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        name: text('name').notNull(),
    },
    table => [primaryKey({ columns: [table.cuisineId, table.language] })],
);

export const cuisinesRelations = relations(cuisines, ({ many }) => ({
    translations: many(cuisineTranslations),
}));

export const cuisineTranslationsRelations = relations(cuisineTranslations, ({ one }) => ({
    cuisine: one(cuisines, { fields: [cuisineTranslations.cuisineId], references: [cuisines.id] }),
}));
