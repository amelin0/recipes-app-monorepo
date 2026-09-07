import { relations } from 'drizzle-orm';
import { date, integer, numeric, pgEnum, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { Gender, UserGoal } from '@dns/shared-types';

import { users } from './users.schema';

export const genderEnum = pgEnum('gender', [Gender.Male, Gender.Female]);

export const userGoalEnum = pgEnum('user_goal', [
    UserGoal.Maintain,
    UserGoal.GainMuscle,
    UserGoal.LoseWeight,
    UserGoal.LearnCooking,
]);

/**
 * Personal data, kept apart from `users`.
 *
 * Two reasons for the split rather than wider `users`. `JwtStrategy` reads
 * `users` on every authenticated request, and that row should stay narrow.
 * And the deletion flow has to erase personal data while the identity row
 * survives its grace period — a boundary that is easier to honour when it is
 * also a table boundary.
 *
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

    // --- questionnaire answers (onboarding profile-setup) ---
    // All nullable: the questionnaire fills them step by step, and a profile
    // half way through it is a normal state, not a broken one.

    gender: genderEnum('gender'),
    birthDate: date('birth_date'),

    // Always metric, whatever the user reads them in (FR-006d): the formulas
    // must not depend on a display preference, and switching the preference
    // later has to change the presentation rather than lose the value.
    weightKg: numeric('weight_kg', { precision: 5, scale: 1 }),
    heightCm: numeric('height_cm', { precision: 4, scale: 1 }),

    // 1..8 on the questionnaire's slider; null means «not chosen yet», which
    // is the state the continue button stays disabled in.
    activityLevel: smallint('activity_level'),

    goal: userGoalEnum('goal'),

    // Not applicable when the goal is «learn to cook» — that one is not about
    // weight, so the step is skipped and the column stays null.
    targetWeightKg: numeric('target_weight_kg', { precision: 5, scale: 1 }),

    // --- questionnaire state (FR-001, FR-005) ---

    // Where to resume. Zero means «not started»; the flag below, not this
    // number, is what says the questionnaire is done.
    onboardingStep: integer('onboarding_step').notNull().default(0),

    // Set once, at the end. On the account rather than the device, so a new
    // phone does not ask the same sixteen questions again (FR-001).
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),

    /**
     * When the paywall was last put in front of this person.
     *
     * Here rather than in the subscription domain because it is the next step
     * of the funnel this row already tracks — and because somebody who
     * skipped has no subscription for it to hang off. Set, the paywall stops
     * opening by itself (paywall FR-007).
     */
    paywallSeenAt: timestamp('paywall_seen_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));
