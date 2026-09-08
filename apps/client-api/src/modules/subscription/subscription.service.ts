import { randomBytes } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsProducer } from '@dns/api-common';
import { PurchasesService } from '@dns/api-infrastructure/purchases';
import { REFERRAL_CODE_LENGTH, REFERRAL_REWARD } from '@dns/constants';
import {
    ProfileRepository,
    ReferenceEntity,
    ReferralStats,
    SubscriptionEntity,
    SubscriptionPlanEntity,
    SubscriptionRepository,
} from '@dns/database';
import {
    BillingPeriod,
    NotificationEvent,
    PurchaseStore,
    SubscriptionSource,
    SubscriptionStatus,
} from '@dns/shared-types';
import { SubmitReceiptInput } from '@dns/validation';

import { ReaderLanguageService } from '../catalog/reader-language.service';

import { SubscriptionErrorCode } from './subscription.errors';

/** Characters a code is built from — no 0/O or 1/I, because codes get read aloud and retyped. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface PlanOffer {
    plan: SubscriptionPlanEntity;
    /** Per cent saved against paying monthly for the same span (FR-005); null on the monthly plan itself. */
    savingsPercent: number | null;
}

export interface Paywall {
    plans: PlanOffer[];
    features: ReferenceEntity[];
}

export interface SubscriptionState {
    subscription: SubscriptionEntity | null;
    /** Whether the paywall should open by itself (FR-007). */
    paywallPending: boolean;
}

export interface ReferralOverview {
    code: string;
    stats: ReferralStats;
    monthsEarned: number;
}

export interface ReferralOffer {
    code: string;
    freeMonths: number;
    planSlug: string;
}

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly subscriptions: SubscriptionRepository,
        private readonly profiles: ProfileRepository,
        private readonly purchases: PurchasesService,
        private readonly language: ReaderLanguageService,
        private readonly notifications: NotificationsProducer,
    ) {}

    /**
     * What the paywall shows: the plans and the list of what they unlock.
     *
     * The saving badge is computed here from the two prices rather than
     * stored, so it cannot disagree with the figures printed beside it.
     */
    async paywall(userId: string): Promise<Paywall> {
        const language = await this.language.of(userId);
        const [plans, features] = await Promise.all([
            this.subscriptions.findPlans(language),
            this.subscriptions.findFeatures(language),
        ]);

        const monthly = plans.find(plan => plan.period === BillingPeriod.Month);

        return {
            plans: plans.map(plan => ({ plan, savingsPercent: savingsAgainst(plan, monthly) })),
            features,
        };
    }

    async state(userId: string): Promise<SubscriptionState> {
        const language = await this.language.of(userId);
        const [subscription, profile] = await Promise.all([
            this.subscriptions.findActive(userId, language),
            this.profiles.findByUserId(userId),
        ]);

        return {
            subscription,
            // Already subscribed means nothing to sell (paywall edge case),
            // and having been shown it once is the whole of FR-007.
            paywallPending: subscription === null && profile?.paywallSeenAt == null,
        };
    }

    async dismissPaywall(userId: string): Promise<void> {
        await this.profiles.update(userId, { paywallSeenAt: new Date() });
    }

    /**
     * Turns a store receipt into a subscription.
     *
     * **The plan comes from the store's product id, never from the client.**
     * A body that named its own plan would let somebody pay for a month and
     * ask for a year.
     */
    async redeemReceipt(userId: string, input: SubmitReceiptInput): Promise<SubscriptionEntity> {
        const verified = await this.purchases.verify(input);

        const existing = await this.subscriptions.findByTransaction(verified.transactionId);
        if (existing) {
            // Replaying a receipt on a second account would buy a second
            // subscription with one payment; on the same account it is the
            // client retrying, which is not an error.
            if (existing.userId !== userId) {
                throw new BadRequestException({
                    message: 'This receipt has already been used',
                    code: SubscriptionErrorCode.ReceiptAlreadyUsed,
                });
            }

            return this.readBack(userId);
        }

        const language = await this.language.of(userId);
        const plans = await this.subscriptions.findPlans(language);
        const plan = plans.find(candidate =>
            verified.store === PurchaseStore.Apple
                ? candidate.appleProductId === verified.productId
                : candidate.googleProductId === verified.productId,
        );

        if (!plan) {
            throw new BadRequestException({
                message: 'The receipt names a product this server does not sell',
                code: SubscriptionErrorCode.UnknownProduct,
            });
        }

        await this.close(userId);

        const row = await this.subscriptions.create({
            userId,
            planId: plan.id,
            source: verified.isTrial ? SubscriptionSource.Trial : SubscriptionSource.Purchase,
            status: SubscriptionStatus.Active,
            startedAt: verified.startedAt,
            expiresAt: verified.expiresAt,
            // A trial charges nothing now; the price is what the plan will
            // cost when it converts, and the receipt is the record of that.
            pricePaidCents: verified.isTrial ? 0 : plan.priceCents,
            fullPriceCents: plan.fullPriceCents,
            currency: plan.currency,
            store: verified.store,
            storeTransactionId: verified.transactionId,
        });

        await this.dismissPaywall(userId);

        // After the row exists, and never inside its transaction: the purchase
        // is what must survive, the message about it is not.
        await this.notifications.emit(userId, NotificationEvent.SubscriptionActivated, { date: row.expiresAt });

        return SubscriptionEntity.from({
            ...row,
            planSlug: plan.slug,
            planName: plan.name,
            planPeriod: plan.period,
        });
    }

    /** What a code gives, without spending it (FR-008). */
    async describeCode(userId: string, code: string): Promise<ReferralOffer> {
        await this.assertRedeemable(userId, code);

        return { code, freeMonths: REFERRAL_REWARD.freeMonths, planSlug: REFERRAL_REWARD.planSlug };
    }

    /**
     * Spends a code: a free month, no store involved.
     *
     * The reward lands on the monthly plan because that is what the design
     * grants (FR-009); a code held against the annual plan has nothing to
     * give, and saying so is better than quietly discounting it.
     */
    async redeemCode(userId: string, code: string): Promise<SubscriptionEntity> {
        const referrerUserId = await this.assertRedeemable(userId, code);

        const language = await this.language.of(userId);
        const plan = await this.subscriptions.findPlanBySlug(REFERRAL_REWARD.planSlug, language);

        if (!plan) {
            throw new BadRequestException({
                message: 'The plan this code applies to is not on sale',
                code: SubscriptionErrorCode.UnknownProduct,
            });
        }

        const startedAt = new Date();

        await this.close(userId);

        const row = await this.subscriptions.create({
            userId,
            planId: plan.id,
            source: SubscriptionSource.Referral,
            status: SubscriptionStatus.Active,
            startedAt,
            expiresAt: addMonths(startedAt, REFERRAL_REWARD.freeMonths),
            pricePaidCents: 0,
            fullPriceCents: plan.priceCents,
            currency: plan.currency,
            referralCode: code,
            store: PurchaseStore.None,
        });

        await this.subscriptions.recordRedemption(userId, referrerUserId, code);
        await this.dismissPaywall(userId);

        await this.notifications.emit(userId, NotificationEvent.SubscriptionActivated, { date: row.expiresAt });

        // The referrer is the one who otherwise never finds out: their screen
        // shows a number that moves with nothing to explain it.
        await this.notifications.emit(referrerUserId, NotificationEvent.ReferralRedeemed);

        return SubscriptionEntity.from({
            ...row,
            planSlug: plan.slug,
            planName: plan.name,
            planPeriod: plan.period,
        });
    }

    /**
     * This account's own code and how it has done (referral FR-001, FR-004).
     *
     * The code is minted on first look rather than at sign-up: most accounts
     * never open this screen, and a code nobody has seen is a row nobody
     * needs.
     */
    async referral(userId: string): Promise<ReferralOverview> {
        const existing = await this.subscriptions.findReferralCode(userId);
        const code = existing ?? (await this.mintCode(userId));
        const stats = await this.subscriptions.referralStats(userId);

        return { code, stats, monthsEarned: stats.converted * REFERRAL_REWARD.freeMonths };
    }

    /** Returns the code's owner — the checks are the same for describing and for spending. */
    private async assertRedeemable(userId: string, code: string): Promise<string> {
        const referrerUserId = await this.subscriptions.findCodeOwner(code);

        if (!referrerUserId) {
            throw new NotFoundException({
                message: 'No such referral code',
                code: SubscriptionErrorCode.UnknownReferralCode,
            });
        }

        if (referrerUserId === userId) {
            throw new BadRequestException({
                message: 'A code cannot be redeemed by its owner',
                code: SubscriptionErrorCode.OwnReferralCode,
            });
        }

        if (await this.subscriptions.hasRedeemed(userId)) {
            throw new BadRequestException({
                message: 'This account has already redeemed a referral code',
                code: SubscriptionErrorCode.AlreadyRedeemed,
            });
        }

        return referrerUserId;
    }

    /**
     * A subscription already in hand means there is nothing to sell.
     *
     * Sweeping lapsed rows first is what makes buying again possible: the
     * database allows one row marked active per account, and a subscription
     * whose date has passed is only still marked so because nobody has looked
     * at it since.
     */
    private async close(userId: string): Promise<void> {
        await this.subscriptions.expireLapsed(userId);

        const language = await this.language.of(userId);
        const active = await this.subscriptions.findActive(userId, language);

        if (active) {
            throw new BadRequestException({
                message: 'This account already has an active subscription',
                code: SubscriptionErrorCode.AlreadySubscribed,
            });
        }
    }

    /** Used only where a live row is certain: answering a replayed receipt. */
    private async readBack(userId: string): Promise<SubscriptionEntity> {
        const language = await this.language.of(userId);
        const active = await this.subscriptions.findActive(userId, language);

        if (!active) {
            throw new BadRequestException({
                message: 'This receipt has already been used',
                code: SubscriptionErrorCode.ReceiptAlreadyUsed,
            });
        }

        return active;
    }

    private async mintCode(userId: string): Promise<string> {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = randomCode();

            if ((await this.subscriptions.findCodeOwner(code)) === null) {
                await this.subscriptions.createReferralCode(userId, code);
                const stored = await this.subscriptions.findReferralCode(userId);

                // Two requests can race here; whoever lost reads the winner's
                // code rather than overwriting it.
                if (stored) return stored;
            }
        }

        throw new Error('Failed to mint a referral code');
    }
}

/**
 * How much cheaper a month of this plan is than a month of the monthly plan
 * (FR-005). Null when there is nothing to compare against, or when the plan
 * is the monthly one.
 */
function savingsAgainst(plan: SubscriptionPlanEntity, monthly: SubscriptionPlanEntity | undefined): number | null {
    if (!monthly || plan.id === monthly.id || monthly.priceCents === 0) return null;

    const saved = 1 - plan.monthlyPriceCents / monthly.priceCents;

    return saved > 0 ? Math.round(saved * 100) : null;
}

/**
 * The same day next month, or the last day of it.
 *
 * The 31st of January plus one month is the 28th of February, not the 3rd of
 * March — which is what `setMonth` alone would give (paywall edge case).
 */
function addMonths(from: Date, months: number): Date {
    const result = new Date(from);
    const day = result.getUTCDate();

    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);

    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));

    return result;
}

function randomCode(): string {
    const bytes = randomBytes(REFERRAL_CODE_LENGTH);
    let code = '';

    for (const byte of bytes) {
        code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }

    return code;
}
