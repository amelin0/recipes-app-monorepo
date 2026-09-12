import { relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { AdminRole } from '@dns/shared-types';

import { adminRefreshTokens } from './admin-refresh-tokens.schema';

export const adminRoleEnum = pgEnum('admin_role', [AdminRole.Admin, AdminRole.SuperAdmin]);

/**
 * A member of staff with access to the admin panel.
 *
 * A separate table rather than a role column on `users`, per
 * [ADR-0003](../../../../docs/adr/0003-auth-model-tokens-and-admin-permissions.md).
 * Different lifecycle — an admin never registers itself and never deletes
 * itself — different fields, and, most of all: a query that deletes a user
 * must have no way of reaching an admin. One table with a role column makes
 * that a matter of remembering a `where`.
 *
 * The same person can hold both an app account and an admin account under one
 * address. They are unrelated: separate passwords, separate sessions, and
 * changing one does not touch the other.
 */
export const admins = pgTable(
    'admins',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        // Stored already lower-cased by the service layer, so the plain unique
        // index below is the case-insensitive constraint sign-in FR-001 needs.
        // `Ivan@` and `ivan@` as two accounts is a ready-made incident.
        email: text('email').notNull(),

        // NOT NULL, unlike `users.password_hash`: there is no OAuth path into
        // the panel, so an admin without a password is an account nobody can
        // use and nobody meant to create.
        passwordHash: text('password_hash').notNull(),

        fullName: text('full_name').notNull(),

        role: adminRoleEnum('role').notNull().default(AdminRole.Admin),

        /**
         * Revocation switch (sign-in FR-008). False stops both new logins and
         * existing sessions: the JWT strategy re-reads this row on every
         * request, so a deactivated admin loses access at once rather than
         * when their access token happens to expire.
         *
         * Deactivated rather than deleted, so the login journal keeps pointing
         * at a real account.
         */
        isActive: boolean('is_active').notNull().default(true),

        /**
         * When every session of this account was last ended wholesale — «sign
         * out everywhere», and deactivation.
         *
         * `is_active` above already stops a deactivated admin on the next
         * request, but nothing stopped a *signed-out* one: the chains went and
         * the access token in the browser kept working for its full fifteen
         * minutes. This marker is what `AdminJwtStrategy` compares each
         * token's `iat` against (sign-in FR-007).
         *
         * Not written by single-browser logout — the admin's other machines
         * must stay signed in.
         */
        sessionsValidFrom: timestamp('sessions_valid_from', { withTimezone: true }),

        lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [uniqueIndex('admins_email_unique').on(table.email)],
);

export const adminsRelations = relations(admins, ({ many }) => ({
    refreshTokens: many(adminRefreshTokens),
}));
