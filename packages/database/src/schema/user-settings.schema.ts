import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { Theme } from '@dns/shared-types';

import { users } from './users.schema';

export const themeEnum = pgEnum('theme', [Theme.Light, Theme.Dark, Theme.System]);

/**
 * How the app renders for this user. One row per account, written at sign-up
 * so every read finds defaults already in place.
 *
 * Four separate unit columns rather than one system-wide switch: app-settings
 * FR-005 lets body mass, product weight, length and water be chosen
 * independently, and someone who thinks in kilograms but pounds of chicken is
 * the case that forces this.
 */
export const userSettings = pgTable('user_settings', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Text rather than an enum: the supported-language list changes with
    // content, not with a migration. `@dns/constants` holds the valid set and
    // the request schema enforces it.
    language: text('language').notNull(),

    theme: themeEnum('theme').notNull(),

    massUnit: text('mass_unit').notNull(),
    productWeightUnit: text('product_weight_unit').notNull(),
    lengthUnit: text('length_unit').notNull(),
    waterUnit: text('water_unit').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));
