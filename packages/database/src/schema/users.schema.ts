import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { accountDeletionRequests } from './account-deletion-requests.schema';
import { oauthIdentities } from './oauth-identities.schema';
import { otpCodes } from './otp-codes.schema';
import { profiles } from './profiles.schema';
import { refreshTokens } from './refresh-tokens.schema';
import { userReminders } from './user-reminders.schema';
import { userSettings } from './user-settings.schema';

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        // Stored already lower-cased by the service layer, so the plain unique
        // index below is the case-insensitive constraint FR-001 asks for.
        // Display casing is not preserved: nothing in the product shows the
        // address back with the capitalisation the user typed.
        email: text('email').notNull(),

        // Nullable on purpose: an account created through Apple or Google has
        // no password until the owner sets one via the reset flow
        // (sign-up FR-013). A null here means "no password login", not
        // "password not loaded".
        passwordHash: text('password_hash'),

        // The account exists before this is set — sign-up FR-003 creates the
        // row first and issues no session until the code is confirmed. Null
        // therefore means "registered but unverified", a normal state.
        emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [uniqueIndex('users_email_unique').on(table.email)],
);

export const usersRelations = relations(users, ({ many, one }) => ({
    refreshTokens: many(refreshTokens),
    otpCodes: many(otpCodes),
    oauthIdentities: many(oauthIdentities),
    reminders: many(userReminders),
    deletionRequests: many(accountDeletionRequests),
    profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
    settings: one(userSettings, { fields: [users.id], references: [userSettings.userId] }),
}));
