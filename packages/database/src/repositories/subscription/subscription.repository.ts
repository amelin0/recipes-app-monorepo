import { Injectable } from '@nestjs/common';
import { SQL, and, asc, eq, gt, inArray, isNull, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { PurchaseStore, SubscriptionSource, SubscriptionStatus } from '@dns/shared-types';

import { ReferenceEntity, SubscriptionEntity, SubscriptionPlanEntity } from '../../entities';
import {
    referralCodes,
    referralRedemptions,
    planFeatureTranslations,
    planFeatures,
    subscriptionPlanTranslations,
    subscriptionPlans,
    subscriptions,
} from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertSubscription = typeof subscriptions.$inferInsert;

export interface ReferralStats {
    /** Everybody who redeemed the code. */
    invited: number;
    /** Those of them who have since paid — see `convertedRedemption`. */
    converted: number;
    /** Those whose conversion has actually been rewarded. Trails `converted` only while a grant is failing. */
    rewarded: number;
}

/** How the reward is shaped. The calendar rule belongs to the service, so it is handed in. */
export interface ReferralRewardTerms {
    /** The plan a reward lands on when the referrer has nothing to lengthen. */
    planSlug: string;
    /** Where a period that ends at `from` ends once the reward is added. */
    extend: (from: Date) => Date;
}

export interface GrantedReferralReward {
    referrerUserId: string;
    /** When the referrer's subscription now ends. */
    expiresAt: Date;
    /** Whether a live subscription was lengthened, rather than one created. */
    extended: boolean;
    /** Who bills the subscription that was lengthened — `none` for one we created. */
    store: PurchaseStore;
}

/**
 * Whether a redemption has **converted**: the person who redeemed has since
 * paid for a period of their own.
 *
 * The one definition, used both to count (`referralStats`) and to decide a
 * reward (`grantReferralReward`), so the number on the referral screen cannot
 * describe a different set of people from the ones who earned somebody a month.
 *
 * - **A purchase, not any subscription.** The free month the code itself gives
 *   is a subscription; counting it would pay the referrer for every sign-up,
 *   and sign-ups cost nothing to make. A trial charges nothing either.
 * - **Started after the redemption.** A purchase made before the code was used
 *   was not the code's doing — somebody who had paid, lapsed, and then took a
 *   friend's free month was already a customer.
 */
function convertedRedemption(): SQL {
    return sql`exists (
        select 1 from ${subscriptions}
        where ${subscriptions.userId} = ${referralRedemptions.redeemerUserId}
          and ${subscriptions.source} = ${SubscriptionSource.Purchase}
          and ${subscriptions.startedAt} >= ${referralRedemptions.redeemedAt}
    )`;
}

@Injectable()
export class SubscriptionRepository extends BaseRepository {
    async findPlans(language: string): Promise<SubscriptionPlanEntity[]> {
        const preferred = alias(subscriptionPlanTranslations, 'preferred_plan_name');
        const fallback = alias(subscriptionPlanTranslations, 'fallback_plan_name');
        const name = sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${subscriptionPlans.slug})`;

        const rows = await this.db
            .select({ plan: subscriptionPlans, name })
            .from(subscriptionPlans)
            .leftJoin(preferred, and(eq(preferred.planId, subscriptionPlans.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.planId, subscriptionPlans.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(eq(subscriptionPlans.isActive, true))
            .orderBy(asc(subscriptionPlans.sortOrder));

        return rows.map(row => SubscriptionPlanEntity.from({ ...row.plan, name: row.name }));
    }

    async findPlanBySlug(slug: string, language: string): Promise<SubscriptionPlanEntity | null> {
        const plans = await this.findPlans(language);
        return plans.find(plan => plan.slug === slug) ?? null;
    }

    /** What the subscription unlocks — the same list on the paywall and the receipt (FR-003). */
    async findFeatures(language: string): Promise<ReferenceEntity[]> {
        const preferred = alias(planFeatureTranslations, 'preferred_feature_title');
        const fallback = alias(planFeatureTranslations, 'fallback_feature_title');

        const rows = await this.db
            .select({
                id: planFeatures.id,
                slug: planFeatures.slug,
                emoji: planFeatures.emoji,
                sortOrder: planFeatures.sortOrder,
                name: sql<string>`coalesce(${preferred.title}, ${fallback.title}, ${planFeatures.slug})`,
            })
            .from(planFeatures)
            .leftJoin(preferred, and(eq(preferred.featureId, planFeatures.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.featureId, planFeatures.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .orderBy(asc(planFeatures.sortOrder));

        return rows.map(ReferenceEntity.from);
    }

    /**
     * The live subscription, if there is one.
     *
     * A row whose period has run out is reported as expired here rather than
     * by a nightly job: the truth is the date, and a status column that has
     * not been swept yet must not be able to hand somebody a subscription
     * they no longer have.
     */
    async findActive(userId: string, language: string): Promise<SubscriptionEntity | null> {
        const preferred = alias(subscriptionPlanTranslations, 'preferred_plan_name');
        const fallback = alias(subscriptionPlanTranslations, 'fallback_plan_name');

        const [row] = await this.db
            .select({
                subscription: subscriptions,
                planSlug: subscriptionPlans.slug,
                planPeriod: subscriptionPlans.period,
                planName: sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${subscriptionPlans.slug})`,
            })
            .from(subscriptions)
            .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
            .leftJoin(preferred, and(eq(preferred.planId, subscriptionPlans.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.planId, subscriptionPlans.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(
                and(
                    eq(subscriptions.userId, userId),
                    eq(subscriptions.status, SubscriptionStatus.Active),
                    sql`${subscriptions.expiresAt} > now()`,
                ),
            );

        if (!row) return null;

        return SubscriptionEntity.from({ ...row.subscription, ...row });
    }

    /**
     * Returns the row it wrote rather than leaving the caller to find it.
     *
     * Reading it back through `findActive` looked tidier and was wrong: a
     * receipt whose period has already ended — a lapsed subscription being
     * restored — creates a row that filter deliberately hides, and the caller
     * would have concluded the insert had failed.
     */
    async create(data: InsertSubscription): Promise<typeof subscriptions.$inferSelect> {
        const [row] = await this.db.insert(subscriptions).values(data).returning();
        if (!row) throw new Error('Failed to insert subscription');

        return row;
    }

    /**
     * Moves rows whose period has run out from «active» to «expired».
     *
     * The status column is swept at the moment it matters rather than by a
     * nightly job. Without this the partial unique index — one active row per
     * account — would hold a lapsed subscription open forever and refuse the
     * purchase meant to replace it.
     */
    async expireLapsed(userId: string): Promise<void> {
        await this.db
            .update(subscriptions)
            .set({ status: SubscriptionStatus.Expired })
            .where(
                and(
                    eq(subscriptions.userId, userId),
                    eq(subscriptions.status, SubscriptionStatus.Active),
                    sql`${subscriptions.expiresAt} <= now()`,
                ),
            );
    }

    /**
     * Active subscriptions whose date has already passed, across all accounts.
     *
     * `expireLapsed` above sweeps one account at the moment it tries to buy
     * again. That is enough to keep the unique index honest, and not enough to
     * tell anybody their premium ended — which is what this is for.
     */
    async findLapsed(now: Date): Promise<{ id: string; userId: string; expiresAt: Date }[]> {
        return this.db
            .select({
                id: subscriptions.id,
                userId: subscriptions.userId,
                expiresAt: subscriptions.expiresAt,
            })
            .from(subscriptions)
            .where(and(eq(subscriptions.status, SubscriptionStatus.Active), lte(subscriptions.expiresAt, now)));
    }

    /** Active subscriptions running out inside the window — the warning, before the fact. */
    async findExpiringBetween(from: Date, to: Date): Promise<{ id: string; userId: string; expiresAt: Date }[]> {
        return this.db
            .select({
                id: subscriptions.id,
                userId: subscriptions.userId,
                expiresAt: subscriptions.expiresAt,
            })
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.status, SubscriptionStatus.Active),
                    gt(subscriptions.expiresAt, from),
                    lte(subscriptions.expiresAt, to),
                ),
            );
    }

    /** Marks named rows expired. Ids rather than a date predicate: the job has already decided. */
    async markExpired(ids: string[]): Promise<number> {
        if (ids.length === 0) return 0;

        const updated = await this.db
            .update(subscriptions)
            .set({ status: SubscriptionStatus.Expired })
            .where(and(inArray(subscriptions.id, ids), eq(subscriptions.status, SubscriptionStatus.Active)))
            .returning({ id: subscriptions.id });

        return updated.length;
    }

    /** Whether this receipt has already bought something, for anybody. */
    async findByTransaction(transactionId: string): Promise<{ userId: string } | null> {
        const row = await this.db.query.subscriptions.findFirst({
            where: eq(subscriptions.storeTransactionId, transactionId),
            columns: { userId: true },
        });

        return row ?? null;
    }

    async findReferralCode(userId: string): Promise<string | null> {
        const row = await this.db.query.referralCodes.findFirst({ where: eq(referralCodes.userId, userId) });
        return row?.code ?? null;
    }

    /**
     * The account behind a code.
     *
     * Codes are compared already normalised — the caller upper-cases and trims
     * before asking, so « abc123 » and «ABC123» are the same code (paywall
     * edge case).
     */
    async findCodeOwner(code: string): Promise<string | null> {
        const row = await this.db.query.referralCodes.findFirst({ where: eq(referralCodes.code, code) });
        return row?.userId ?? null;
    }

    async createReferralCode(userId: string, code: string): Promise<void> {
        await this.db.insert(referralCodes).values({ userId, code }).onConflictDoNothing();
    }

    async hasRedeemed(userId: string): Promise<boolean> {
        const row = await this.db.query.referralRedemptions.findFirst({
            where: eq(referralRedemptions.redeemerUserId, userId),
        });

        return row !== undefined;
    }

    async recordRedemption(redeemerUserId: string, referrerUserId: string, code: string): Promise<void> {
        await this.db.insert(referralRedemptions).values({ redeemerUserId, referrerUserId, code });
    }

    /**
     * How this account's code has done (referral FR-004).
     *
     * One row per redemption, counted by predicate — not a join against
     * `subscriptions`. The join this replaced counted subscription **rows**:
     * it included the free month the code itself grants, so every redemption
     * was «converted» on the spot, and somebody who later bought as well was
     * counted twice.
     */
    async referralStats(userId: string): Promise<ReferralStats> {
        const [row] = await this.db
            .select({
                invited: sql<number>`count(*)::int`,
                converted: sql<number>`(count(*) filter (where ${convertedRedemption()}))::int`,
                rewarded: sql<number>`count(${referralRedemptions.rewardedAt})::int`,
            })
            .from(referralRedemptions)
            .where(eq(referralRedemptions.referrerUserId, userId));

        return { invited: row?.invited ?? 0, converted: row?.converted ?? 0, rewarded: row?.rewarded ?? 0 };
    }

    /**
     * Gives the referrer their month for this redeemer's first purchase —
     * once, and all of it or none of it (referral FR-006).
     *
     * Returns null when there is nothing to grant: the buyer was not invited,
     * has not converted, or the month was granted already. That last case is
     * the ordinary one on a retried receipt and is not an error.
     *
     * **The claim is the idempotency.** `rewarded_at` goes from null to a date
     * in a conditional update, on a row the primary key makes unique per
     * redeemer; a second caller — a replayed receipt, a concurrent retry —
     * waits on the row lock, re-reads it, finds the date and matches nothing.
     * There is no read-then-write in the service to race.
     *
     * **One transaction** for the claim and the grant: a failure anywhere rolls
     * the claim back with it, so the reward is either granted and recorded or
     * still waiting to be — never recorded and not granted.
     *
     * Lengthening a subscription a store bills moves only our date, not the
     * store's — see the referral plan for what that means at renewal.
     */
    async grantReferralReward(
        redeemerUserId: string,
        terms: ReferralRewardTerms,
    ): Promise<GrantedReferralReward | null> {
        return this.db.transaction(async tx => {
            const [claimed] = await tx
                .update(referralRedemptions)
                .set({ rewardedAt: sql`now()` })
                .where(
                    and(
                        eq(referralRedemptions.redeemerUserId, redeemerUserId),
                        isNull(referralRedemptions.rewardedAt),
                        convertedRedemption(),
                    ),
                )
                .returning({ referrerUserId: referralRedemptions.referrerUserId, code: referralRedemptions.code });

            if (!claimed) return null;

            const { referrerUserId, code } = claimed;

            // Two friends of the same referrer can convert at the same moment.
            // Without a lock both would read the same end date and one month
            // would be lost, or both would find nothing active and the second
            // insert would hit the one-active-per-account index. The referrer's
            // code row is the natural thing to queue on: it exists (the code
            // was redeemed) and nothing else writes to it.
            await tx
                .select({ userId: referralCodes.userId })
                .from(referralCodes)
                .where(eq(referralCodes.userId, referrerUserId))
                .for('update');

            // Same sweep as a purchase, for the same reason: a lapsed row still
            // marked active would be lengthened from a date in the past, or
            // would block the insert below.
            await tx
                .update(subscriptions)
                .set({ status: SubscriptionStatus.Expired })
                .where(
                    and(
                        eq(subscriptions.userId, referrerUserId),
                        eq(subscriptions.status, SubscriptionStatus.Active),
                        sql`${subscriptions.expiresAt} <= now()`,
                    ),
                );

            const [active] = await tx
                .select({ id: subscriptions.id, expiresAt: subscriptions.expiresAt, store: subscriptions.store })
                .from(subscriptions)
                .where(
                    and(eq(subscriptions.userId, referrerUserId), eq(subscriptions.status, SubscriptionStatus.Active)),
                );

            if (active) {
                const expiresAt = terms.extend(active.expiresAt);

                await tx.update(subscriptions).set({ expiresAt }).where(eq(subscriptions.id, active.id));

                return { referrerUserId, expiresAt, extended: true, store: active.store };
            }

            const [plan] = await tx
                .select({
                    id: subscriptionPlans.id,
                    priceCents: subscriptionPlans.priceCents,
                    currency: subscriptionPlans.currency,
                })
                .from(subscriptionPlans)
                .where(and(eq(subscriptionPlans.slug, terms.planSlug), eq(subscriptionPlans.isActive, true)));

            // Thrown rather than skipped: returning here would commit the claim
            // with nothing granted, which is the one outcome this method exists
            // to rule out.
            if (!plan) throw new Error(`The referral reward plan «${terms.planSlug}» is not on sale`);

            const startedAt = new Date();
            const expiresAt = terms.extend(startedAt);

            // The same row `redeemCode` writes for the person who used the code:
            // the monthly plan, nothing paid, no store.
            await tx.insert(subscriptions).values({
                userId: referrerUserId,
                planId: plan.id,
                source: SubscriptionSource.Referral,
                status: SubscriptionStatus.Active,
                startedAt,
                expiresAt,
                pricePaidCents: 0,
                fullPriceCents: plan.priceCents,
                currency: plan.currency,
                referralCode: code,
                store: PurchaseStore.None,
            });

            return { referrerUserId, expiresAt, extended: false, store: PurchaseStore.None };
        });
    }
}
