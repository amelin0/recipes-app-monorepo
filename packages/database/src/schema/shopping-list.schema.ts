import { relations } from 'drizzle-orm';
import { boolean, numeric, pgEnum, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { ShoppingItemOrigin } from '@dns/shared-types';

import { products } from './products.schema';
import { users } from './users.schema';

export const shoppingItemOriginEnum = pgEnum('shopping_item_origin', [
    ShoppingItemOrigin.Manual,
    ShoppingItemOrigin.Plan,
]);

/**
 * A product somebody put on the list by hand.
 *
 * **Only the manual ones are stored.** Everything imported from the meal plan
 * is derived on read by summing the composition of the planned dishes — so the
 * list cannot drift out of step with the plan, and the «rules for re-syncing»
 * the spec leaves open never need writing.
 *
 * One row per product, enforced by the primary key: adding the same product
 * again sums into the row that is already there (add-product FR-009), and
 * SC-003's «no duplicates» is then a property of the schema rather than a
 * promise the service keeps.
 */
export const shoppingListItems = pgTable(
    'shopping_list_items',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),

        amountG: numeric('amount_g', { precision: 9, scale: 2 }).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [primaryKey({ columns: [table.userId, table.productId] })],
);

/**
 * A ticked checkbox.
 *
 * Kept apart from the item because half the list has no row to tick: an
 * imported line exists only as a sum over the plan. Presence of a mark is the
 * whole state — an unticked box is the absence of a row, not a `false`.
 *
 * Keyed by origin as well as product: the same product can stand on the list
 * twice, once imported and once added by hand (add-product FR-009), and
 * buying the 200 g you added must not grey out the 500 g the plan needs.
 */
export const shoppingListMarks = pgTable(
    'shopping_list_marks',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),

        origin: shoppingItemOriginEnum('origin').notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [primaryKey({ columns: [table.userId, table.productId, table.origin] })],
);

/**
 * The «Додати з плану» switch (weekly-list FR-004), on by default.
 *
 * Its own row rather than a column on `user_settings`: that table is about how
 * the app renders — theme, units, language — and a shopping-list switch there
 * would make the profile settings payload the place domains get dumped.
 */
export const shoppingListSettings = pgTable('shopping_list_settings', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),

    importFromPlan: boolean('import_from_plan').notNull().default(true),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
    user: one(users, { fields: [shoppingListItems.userId], references: [users.id] }),
    product: one(products, { fields: [shoppingListItems.productId], references: [products.id] }),
}));

export const shoppingListMarksRelations = relations(shoppingListMarks, ({ one }) => ({
    user: one(users, { fields: [shoppingListMarks.userId], references: [users.id] }),
    product: one(products, { fields: [shoppingListMarks.productId], references: [products.id] }),
}));
