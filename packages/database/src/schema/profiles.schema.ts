import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * Personal data, kept apart from `users`.
 *
 * Two reasons for the split rather than wider `users`. `JwtStrategy` reads
 * `users` on every authenticated request, and that row should stay narrow.
 * And the deletion flow has to erase personal data while the identity row
 * survives its grace period — a boundary that is easier to honour when it is
 * also a table boundary.
 *
 * The questionnaire (onboarding profile-setup) adds gender, birth date,
 * height, activity level and goals here in its own slice.
 */
export const profiles = pgTable('profiles', {
    // The user id is the key: exactly one profile per account, no orphans.
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Null until the questionnaire or the edit screen sets it. The avatar
    // falls back to initials, so an empty name is a normal state, not an error.
    name: text('name'),

    photoUrl: text('photo_url'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));
