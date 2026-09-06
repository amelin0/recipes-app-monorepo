import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { OAuthProvider } from '@dns/shared-types';

import { users } from './users.schema';

export const oauthProviderEnum = pgEnum('oauth_provider', [OAuthProvider.Apple, OAuthProvider.Google]);

/**
 * Links an account to an identity at Apple or Google. One account may hold
 * several identities plus a password (sign-in FR-006 links rather than
 * duplicates when the provider's email matches an existing account).
 *
 * The link hangs off `providerUserId`, never the email: Apple's private relay
 * address can change, and keying on it would cut the owner off from their own
 * account (sign-up spec, Key Entities).
 */
export const oauthIdentities = pgTable(
    'oauth_identities',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        provider: oauthProviderEnum('provider').notNull(),
        providerUserId: text('provider_user_id').notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [uniqueIndex('oauth_identities_provider_user_unique').on(table.provider, table.providerUserId)],
);

export const oauthIdentitiesRelations = relations(oauthIdentities, ({ one }) => ({
    user: one(users, { fields: [oauthIdentities.userId], references: [users.id] }),
}));
