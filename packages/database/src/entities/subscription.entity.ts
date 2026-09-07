import { BillingPeriod, PurchaseStore, SubscriptionSource, SubscriptionStatus } from '@dns/shared-types';

import { subscriptionPlans, subscriptions } from '../schema';

type PlanRow = typeof subscriptionPlans.$inferSelect;
type SubscriptionRow = typeof subscriptions.$inferSelect;

export interface PlanRowWithName extends PlanRow {
    name: string;
}

export class SubscriptionPlanEntity {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly period: BillingPeriod;
    readonly priceCents: number;
    readonly fullPriceCents: number | null;
    readonly currency: string;
    readonly trialDays: number;
    readonly appleProductId: string | null;
    readonly googleProductId: string | null;
    readonly sortOrder: number;
    readonly isDefault: boolean;

    private constructor(row: PlanRowWithName) {
        this.id = row.id;
        this.slug = row.slug;
        this.name = row.name;
        this.period = row.period as BillingPeriod;
        this.priceCents = row.priceCents;
        this.fullPriceCents = row.fullPriceCents;
        this.currency = row.currency;
        this.trialDays = row.trialDays;
        this.appleProductId = row.appleProductId;
        this.googleProductId = row.googleProductId;
        this.sortOrder = row.sortOrder;
        this.isDefault = row.isDefault;
    }

    /** What a month of this plan costs — the figure the two plans are compared on. */
    get monthlyPriceCents(): number {
        return this.period === BillingPeriod.Year ? Math.round(this.priceCents / 12) : this.priceCents;
    }

    static from(row: PlanRowWithName): SubscriptionPlanEntity {
        return new SubscriptionPlanEntity(row);
    }
}

export interface SubscriptionRowWithPlan extends SubscriptionRow {
    planSlug: string;
    planName: string;
    planPeriod: string;
}

export class SubscriptionEntity {
    readonly id: string;
    readonly planId: string;
    readonly planSlug: string;
    readonly planName: string;
    readonly planPeriod: BillingPeriod;
    readonly source: SubscriptionSource;
    readonly status: SubscriptionStatus;
    readonly startedAt: Date;
    readonly expiresAt: Date;
    readonly pricePaidCents: number;
    readonly fullPriceCents: number | null;
    readonly currency: string;
    readonly referralCode: string | null;
    readonly store: PurchaseStore;

    private constructor(row: SubscriptionRowWithPlan) {
        this.id = row.id;
        this.planId = row.planId;
        this.planSlug = row.planSlug;
        this.planName = row.planName;
        this.planPeriod = row.planPeriod as BillingPeriod;
        this.source = row.source as SubscriptionSource;
        this.status = row.status as SubscriptionStatus;
        this.startedAt = row.startedAt;
        this.expiresAt = row.expiresAt;
        this.pricePaidCents = row.pricePaidCents;
        this.fullPriceCents = row.fullPriceCents;
        this.currency = row.currency;
        this.referralCode = row.referralCode;
        this.store = row.store as PurchaseStore;
    }

    /**
     * Whole days left, never negative.
     *
     * Rounded up, because the confirmation screen counts days a person still
     * has: with eighteen hours to go the honest answer is «1», not «0».
     */
    get daysRemaining(): number {
        const ms = this.expiresAt.getTime() - Date.now();
        return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
    }

    static from(row: SubscriptionRowWithPlan): SubscriptionEntity {
        return new SubscriptionEntity(row);
    }
}
