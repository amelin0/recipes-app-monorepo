import { SQL, SQLWrapper, relations, sql } from 'drizzle-orm';
import {
    boolean,
    index,
    numeric,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core';

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

        /**
         * Set when a product is taken out of the catalogue (admin
         * product-catalogue FR-008).
         *
         * Not a `DELETE`, and that is the point: `recipe_ingredients`
         * references products with ON DELETE RESTRICT precisely so removing
         * one cannot hollow out a dish. Archiving keeps every reference intact
         * — recipes, meal-log entries, shopping lists — and only hides the row
         * from search, on both surfaces.
         */
        archivedAt: timestamp('archived_at', { withTimezone: true }),

        /**
         * The English name, normalised by `englishNameKey` — the identity a
         * recipe CSV addresses a catalogue product by (`Tomatoes:250`).
         *
         * A copy of what `product_translations` holds, and a deliberate one:
         * the name lives in that table and the scope (`source`) lives in this
         * one, and Postgres cannot index across two tables. Only here can a
         * unique index say «no two **global** products share an English name»
         * while leaving private products alone — every user may have their
         * own «Tomatoes», and none of them may block or be overwritten by the
         * catalogue's.
         *
         * Written in the same transaction as the English translation by
         * everything that writes a global product: the admin create, edit and
         * import, verification (which promotes a private product and has to
         * compute it then), and the seed. Null on private products the app
         * creates — the index ignores them anyway — and on a product with no
         * English name.
         */
        nameEnKey: text('name_en_key'),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('products_source_creator_idx').on(table.source, table.createdBy),
        uniqueIndex('products_global_name_en_key_unique')
            .on(table.nameEnKey)
            .where(sql`${table.source} = 'global'`),
    ],
);

/**
 * How an English name becomes `products.name_en_key`: trimmed and
 * lower-cased, in SQL so that the column, every lookup against it and the
 * migration's backfill share one definition.
 *
 * Case-insensitive because the recipe import matches names that way — two
 * rows differing only in case would still be one name to it.
 */
export function englishNameKey(name: SQLWrapper | string): SQL {
    return sql`lower(btrim(${name}::text))`;
}

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
