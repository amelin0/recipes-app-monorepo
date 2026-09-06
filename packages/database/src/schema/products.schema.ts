import { relations } from 'drizzle-orm';
import { boolean, index, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { ContentSource } from '@dns/shared-types';

import { productGroups } from './product-groups.schema';
import { users } from './users.schema';

export const contentSourceEnum = pgEnum('content_source', [ContentSource.Global, ContentSource.Custom]);

/**
 * Everything edible the app knows a number about.
 *
 * There is deliberately **no** separate `ingredients` table: a product in a
 * recipe's composition is that recipe's ingredient, and the word stays a role
 * rather than a second entity ([ADR-0006](../../../../docs/adr/0006-products-absorb-ingredients.md)).
 * That is what makes a user's own dish computable at all — the composition
 * points at the row that carries the macros.
 *
 * Macros are per 100 g, always. A serving («1 шт (89 г)») is a display
 * convenience on top of that, not a second unit of storage, so a product whose
 * typical serving is unknown is still complete.
 */
export const products = pgTable(
    'products',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        source: contentSourceEnum('source').notNull(),

        groupId: uuid('group_id').references(() => productGroups.id, { onDelete: 'set null' }),

        caloriesPer100g: numeric('calories_per_100g', { precision: 7, scale: 2 }).notNull(),
        proteinPer100g: numeric('protein_per_100g', { precision: 7, scale: 2 }).notNull(),
        fatsPer100g: numeric('fats_per_100g', { precision: 7, scale: 2 }).notNull(),
        carbsPer100g: numeric('carbs_per_100g', { precision: 7, scale: 2 }).notNull(),

        // What one typical serving weighs (recipe-search FR-003). The phrase in
        // front of it — «1 шт», «1 piece» — is words, so it lives next door with
        // the other words; only the number is language-free.
        servingWeightG: numeric('serving_weight_g', { precision: 7, scale: 2 }),

        // The fifteen the filter screen offers as one-tap chips before anyone
        // opens the full catalogue (recipe-filters FR-002).
        isQuickPick: boolean('is_quick_pick').notNull().default(false),

        isVerified: boolean('is_verified').notNull().default(false),

        /**
         * Null for everything we ship. Detached rather than deleted when its
         * author leaves: a custom product an admin has verified, or that sits
         * inside somebody else's recipe, has stopped being one person's data,
         * and cascading would empty that recipe without telling anyone.
         */
        createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [index('products_source_creator_idx').on(table.source, table.createdBy)],
);

export const productTranslations = pgTable(
    'product_translations',
    {
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        name: text('name').notNull(),
        servingLabel: text('serving_label'),
    },
    table => [
        primaryKey({ columns: [table.productId, table.language] }),
        // Search reads one language at a time; the name match itself is a
        // substring scan, which no btree can serve — a trigram index is the
        // answer once the catalogue outgrows a scan.
        index('product_translations_language_idx').on(table.language),
    ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
    group: one(productGroups, { fields: [products.groupId], references: [productGroups.id] }),
    creator: one(users, { fields: [products.createdBy], references: [users.id] }),
    translations: many(productTranslations),
}));

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
    product: one(products, { fields: [productTranslations.productId], references: [products.id] }),
}));
