import { ApiProperty } from '@nestjs/swagger';

import { SubscriptionEntity } from '@dns/database';
import { BillingPeriod, PurchaseStore, SubscriptionSource, SubscriptionStatus } from '@dns/shared-types';

import { ReferenceView } from '../../../catalog/dto';
import { Paywall, PlanOffer, ReferralOffer, ReferralOverview, SubscriptionState } from '../../subscription.service';

/**
 * A plan on the paywall.
 *
 * Prices are in minor units — cents — because a price is money and money in a
 * float is a rounding bug waiting for a decimal. The currency travels with it;
 * what the store actually charges in the buyer's region is the store's call.
 */
export class PlanView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ example: 'annual' }) readonly slug: string;
    @ApiProperty() readonly name: string;

    @ApiProperty({ enum: BillingPeriod }) readonly period: BillingPeriod;

    @ApiProperty({ example: 4999 }) readonly priceCents: number;

    @ApiProperty({ nullable: true, description: 'Struck through beside the price where there is a discount.' })
    readonly fullPriceCents: number | null;

    @ApiProperty({ description: 'What a month of this plan costs — the figure the two plans compare on.' })
    readonly monthlyPriceCents: number;

    @ApiProperty({ example: 'USD' }) readonly currency: string;

    @ApiProperty({ description: '0 means this plan offers no trial.' }) readonly trialDays: number;

    @ApiProperty({
        nullable: true,
        description: 'Per cent saved against paying monthly; computed, never stored (FR-005).',
    })
    readonly savingsPercent: number | null;

    @ApiProperty({ description: 'Selected when the paywall opens.' }) readonly isDefault: boolean;

    @ApiProperty({ nullable: true, description: 'What to ask the store for on iOS.' })
    readonly appleProductId: string | null;

    @ApiProperty({ nullable: true }) readonly googleProductId: string | null;

    private constructor(offer: PlanOffer) {
        this.id = offer.plan.id;
        this.slug = offer.plan.slug;
        this.name = offer.plan.name;
        this.period = offer.plan.period;
        this.priceCents = offer.plan.priceCents;
        this.fullPriceCents = offer.plan.fullPriceCents;
        this.monthlyPriceCents = offer.plan.monthlyPriceCents;
        this.currency = offer.plan.currency;
        this.trialDays = offer.plan.trialDays;
        this.savingsPercent = offer.savingsPercent;
        this.isDefault = offer.plan.isDefault;
        this.appleProductId = offer.plan.appleProductId;
        this.googleProductId = offer.plan.googleProductId;
    }

    static from(offer: PlanOffer): PlanView {
        return new PlanView(offer);
    }
}

export class PaywallView {
    @ApiProperty({ type: [PlanView] }) readonly plans: PlanView[];

    @ApiProperty({ type: [ReferenceView], description: 'The same list the confirmation screen shows (FR-003).' })
    readonly features: ReferenceView[];

    private constructor(paywall: Paywall) {
        this.plans = paywall.plans.map(PlanView.from);
        this.features = paywall.features.map(ReferenceView.from);
    }

    static from(paywall: Paywall): PaywallView {
        return new PaywallView(paywall);
    }
}

/** A subscription somebody holds — the confirmation screen, and the answer to «am I subscribed». */
export class SubscriptionView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ format: 'uuid' }) readonly planId: string;
    @ApiProperty() readonly planSlug: string;
    @ApiProperty() readonly planName: string;
    @ApiProperty({ enum: BillingPeriod }) readonly period: BillingPeriod;

    @ApiProperty({ enum: SubscriptionSource }) readonly source: SubscriptionSource;
    @ApiProperty({ enum: SubscriptionStatus }) readonly status: SubscriptionStatus;
    @ApiProperty({ enum: PurchaseStore }) readonly store: PurchaseStore;

    @ApiProperty() readonly startedAt: string;
    @ApiProperty() readonly expiresAt: string;

    @ApiProperty({ description: 'Whole days left, rounded up — eighteen hours is still a day to the reader.' })
    readonly daysRemaining: number;

    @ApiProperty({ description: 'What was actually charged; 0 for a trial or a referral month.' })
    readonly pricePaidCents: number;

    @ApiProperty({ nullable: true }) readonly fullPriceCents: number | null;
    @ApiProperty() readonly currency: string;

    @ApiProperty({ nullable: true, description: 'Printed as the «Реф. код» badge.' })
    readonly referralCode: string | null;

    private constructor(subscription: SubscriptionEntity) {
        this.id = subscription.id;
        this.planId = subscription.planId;
        this.planSlug = subscription.planSlug;
        this.planName = subscription.planName;
        this.period = subscription.planPeriod;
        this.source = subscription.source;
        this.status = subscription.status;
        this.store = subscription.store;
        this.startedAt = subscription.startedAt.toISOString();
        this.expiresAt = subscription.expiresAt.toISOString();
        this.daysRemaining = subscription.daysRemaining;
        this.pricePaidCents = subscription.pricePaidCents;
        this.fullPriceCents = subscription.fullPriceCents;
        this.currency = subscription.currency;
        this.referralCode = subscription.referralCode;
    }

    static from(subscription: SubscriptionEntity): SubscriptionView {
        return new SubscriptionView(subscription);
    }
}

export class SubscriptionStateView {
    @ApiProperty({ type: SubscriptionView, nullable: true, description: 'Null while the account is on the free tier.' })
    readonly subscription: SubscriptionView | null;

    @ApiProperty({ description: 'Whether the paywall should open by itself (FR-007).' })
    readonly paywallPending: boolean;

    private constructor(state: SubscriptionState) {
        this.subscription = state.subscription ? SubscriptionView.from(state.subscription) : null;
        this.paywallPending = state.paywallPending;
    }

    static from(state: SubscriptionState): SubscriptionStateView {
        return new SubscriptionStateView(state);
    }
}

/** What a code grants, answered before it is spent. */
export class ReferralOfferView {
    @ApiProperty() readonly code: string;
    @ApiProperty({ example: 1 }) readonly freeMonths: number;

    @ApiProperty({ description: 'The plan the grant lands on; the paywall selects it (FR-009).' })
    readonly planSlug: string;

    private constructor(offer: ReferralOffer) {
        this.code = offer.code;
        this.freeMonths = offer.freeMonths;
        this.planSlug = offer.planSlug;
    }

    static from(offer: ReferralOffer): ReferralOfferView {
        return new ReferralOfferView(offer);
    }
}

export class ReferralOverviewView {
    @ApiProperty({ description: 'This account’s own code, minted the first time it is asked for.' })
    readonly code: string;

    @ApiProperty({ description: 'How many accounts redeemed it.' }) readonly invited: number;

    @ApiProperty({
        description:
            'How many of them have since paid — a purchase begun after redeeming. The free month the code ' +
            'gives and a trial do not count. This is the reward condition.',
    })
    readonly converted: number;

    @ApiProperty({
        description:
            'Months actually granted to this account for its invitations. Equals `converted` × the reward ' +
            'unless a grant is still pending a retry.',
    })
    readonly monthsEarned: number;

    private constructor(overview: ReferralOverview) {
        this.code = overview.code;
        this.invited = overview.stats.invited;
        this.converted = overview.stats.converted;
        this.monthsEarned = overview.monthsEarned;
    }

    static from(overview: ReferralOverview): ReferralOverviewView {
        return new ReferralOverviewView(overview);
    }
}
