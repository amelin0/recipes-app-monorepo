import { relations, sql } from 'drizzle-orm';
import {
    boolean,
    index,
    integer,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core';

import { BillingPeriod, PurchaseStore, SubscriptionSource, SubscriptionStatus } from '@dns/shared-types';

import { users } from './users.schema';

export const billingPeriodEnum = pgEnum('billing_period', [BillingPeriod.Month, BillingPeriod.Year]);

export const subscriptionSourceEnum = pgEnum('subscription_source', [
    SubscriptionSource.Purchase,
    SubscriptionSource.Trial,
    SubscriptionSource.Referral,
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
    SubscriptionStatus.Active,
    SubscriptionStatus.Expired,
    SubscriptionStatus.Cancelled,
]);

export const purchaseStoreEnum = pgEnum('purchase_store', [
    PurchaseStore.Apple,
    PurchaseStore.Google,
    PurchaseStore.None,
]);

/**
 * What can be bought.
 *
 * A table rather than constants because SC-003 asks for prices and plan names
 * to change without an app release. The store still decides what is actually
 * charged and in which currency — these figures are what the paywall prints
 * while it waits for the store sheet to open.
 *
 * The saving badge (FR-005) is **not** here: it is this plan's monthly cost
 * against the monthly plan's, and storing a percentage would let it disagree
 * with the two prices printed beside it.
 */
export const subscriptionPlans = pgTable('subscription_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),

    period: billingPeriodEnum('period').notNull(),

    priceCents: integer('price_cents').notNull(),

    /** The struck-through figure, where there is one (FR-006). */
    fullPriceCents: integer('full_price_cents'),

    currency: text('currency').notNull().default('USD'),

    /** 0 means the plan has no trial to offer (FR-004, story 4). */
    trialDays: integer('trial_days').notNull().default(0),

    // What the app asks the store to sell. Two ids because the two stores
    // keep their own catalogues.
    appleProductId: text('apple_product_id'),
    googleProductId: text('google_product_id'),

    sortOrder: integer('sort_order').notNull(),

    /** Selected when the paywall opens (FR-004, scenario 2). */
    isDefault: boolean('is_default').notNull().default(false),

    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionPlanTranslations = pgTable(
    'subscription_plan_translations',
    {
        planId: uuid('plan_id')
            .notNull()
            .references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        name: text('name').notNull(),
    },
    table => [primaryKey({ columns: [table.planId, table.language] })],
);

/**
 * One line of «what the subscription unlocks».
 *
 * Shared by the paywall and the confirmation screen, which FR-003 requires to
 * list the same things — one table is how that stays true.
 */
export const planFeatures = pgTable('plan_features', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    emoji: text('emoji'),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const planFeatureTranslations = pgTable(
    'plan_feature_translations',
    {
        featureId: uuid('feature_id')
            .notNull()
            .references(() => planFeatures.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        title: text('title').notNull(),
    },
    table => [primaryKey({ columns: [table.featureId, table.language] })],
);

/**
 * What somebody bought.
 *
 * The prices are **copied** rather than read through the plan, the same way a
 * meal log copies what was eaten: this is a receipt, and it has to keep saying
 * what was charged after the plan's price changes (FR-013).
 *
 * `planId` stays as a reference anyway, because the confirmation screen names
 * the plan and the name is translated.
 */
export const subscriptions = pgTable(
    'subscriptions',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        planId: uuid('plan_id')
            .notNull()
            .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),

        source: subscriptionSourceEnum('source').notNull(),
        status: subscriptionStatusEnum('status').notNull(),

        startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

        pricePaidCents: integer('price_paid_cents').notNull(),
        fullPriceCents: integer('full_price_cents'),
        currency: text('currency').notNull(),

        /** Printed as the «Реф. код» badge on the confirmation screen. */
        referralCode: text('referral_code'),

        store: purchaseStoreEnum('store').notNull(),

        /**
         * Unique across accounts: one receipt buys one subscription. Without
         * it a receipt replayed on a second account would buy a second.
         */
        storeTransactionId: text('store_transaction_id').unique(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    table => [
        index('subscriptions_user_idx').on(table.userId),
        // One live subscription per account, enforced by the database rather
        // than by a check the service has to remember to run.
        uniqueIndex('subscriptions_one_active_per_user')
            .on(table.userId)
            .where(sql`${table.status} = 'active'`),
    ],
);

/**
 * The code somebody shares (referral FR-001).
 *
 * One per account, for good: it goes into messages and screenshots that
 * outlive any rotation we might do.
 */
export const referralCodes = pgTable('referral_codes', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),

    code: text('code').notNull().unique(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Somebody redeeming somebody else's code.
 *
 * The primary key is the **redeemer**, which is the rule: an account may
 * redeem one code, once, ever. Anything looser turns a referral programme
 * into a way of never paying.
 */
export const referralRedemptions = pgTable(
    'referral_redemptions',
    {
        redeemerUserId: uuid('redeemer_user_id')
            .primaryKey()
            .references(() => users.id, { onDelete: 'cascade' }),

        referrerUserId: uuid('referrer_user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        code: text('code').notNull(),

        redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),

        /**
         * When the referrer got their month for this invitation (referral
         * FR-006) — null until the redeemer's first paid purchase.
         *
         * On this row rather than in a table of its own because the primary
         * key already says «one per redeemer»: a column that goes from null to
         * a date once, claimed by a conditional update, cannot be claimed
         * twice. A second table would need a second key to say the same thing.
         */
        rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
    },
    table => [index('referral_redemptions_referrer_idx').on(table.referrerUserId)],
);

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
    translations: many(subscriptionPlanTranslations),
}));

export const subscriptionPlanTranslationsRelations = relations(subscriptionPlanTranslations, ({ one }) => ({
    plan: one(subscriptionPlans, {
        fields: [subscriptionPlanTranslations.planId],
        references: [subscriptionPlans.id],
    }),
}));

export const planFeaturesRelations = relations(planFeatures, ({ many }) => ({
    translations: many(planFeatureTranslations),
}));

export const planFeatureTranslationsRelations = relations(planFeatureTranslations, ({ one }) => ({
    feature: one(planFeatures, {
        fields: [planFeatureTranslations.featureId],
        references: [planFeatures.id],
    }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
    plan: one(subscriptionPlans, { fields: [subscriptions.planId], references: [subscriptionPlans.id] }),
}));

export const referralCodesRelations = relations(referralCodes, ({ one }) => ({
    user: one(users, { fields: [referralCodes.userId], references: [users.id] }),
}));

export const referralRedemptionsRelations = relations(referralRedemptions, ({ one }) => ({
    redeemer: one(users, { fields: [referralRedemptions.redeemerUserId], references: [users.id] }),
    referrer: one(users, { fields: [referralRedemptions.referrerUserId], references: [users.id] }),
}));
