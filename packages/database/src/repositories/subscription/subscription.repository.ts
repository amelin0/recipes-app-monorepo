import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { SubscriptionStatus } from '@dns/shared-types';

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
    invited: number;
    converted: number;
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
     * «Invited» is everybody who redeemed it; «converted» is those of them
     * who ended up with a subscription — the condition the reward depends on.
     */
    async referralStats(userId: string): Promise<ReferralStats> {
        const [row] = await this.db
            .select({
                invited: sql<number>`count(*)::int`,
                converted: sql<number>`count(${subscriptions.id})::int`,
            })
            .from(referralRedemptions)
            .leftJoin(subscriptions, eq(subscriptions.userId, referralRedemptions.redeemerUserId))
            .where(eq(referralRedemptions.referrerUserId, userId));

        return { invited: row?.invited ?? 0, converted: row?.converted ?? 0 };
    }
}
