import { randomBytes } from 'node:crypto';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { NotificationsProducer } from '@dns/api-common';
import { PurchasesService } from '@dns/api-infrastructure/purchases';
import { REFERRAL_CODE_LENGTH, REFERRAL_REWARD } from '@dns/constants';
import {
    GrantedReferralReward,
    ProfileRepository,
    ReferenceEntity,
    ReferralStats,
    SubscriptionEntity,
    SubscriptionPlanEntity,
    SubscriptionRepository,
} from '@dns/database';
import { BillingPeriod, NotificationEvent } from '@dns/shared-types';
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
    /** Months actually granted — not months deserved (referral SC-002). */
    monthsEarned: number;
}

export interface ReferralOffer {
    code: string;
    freeMonths: number;
    planSlug: string;
}

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);

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
     *
     * **A verified receipt is never refused for «already subscribed».** The
     * store has charged by the time it reaches us, so the transaction is always
     * recorded, and the answer is the subscription the account has once it is
     * applied: the one this receipt opened, or the one that still stands
     * because it ends later. Which one wins, and why, is the repository's
     * `redeemReceipt` — one transaction under the account lock, which is also
     * what makes a receipt submitted twice at once a retry rather than a 500.
     */
    async redeemReceipt(userId: string, input: SubmitReceiptInput): Promise<SubscriptionEntity> {
        const verified = await this.purchases.verify(input);
        const language = await this.language.of(userId);

        const outcome = await this.subscriptions.redeemReceipt(userId, verified, language);

        if (outcome.kind === 'used-elsewhere') {
            // One payment would otherwise buy a subscription per account.
            throw new BadRequestException({
                message: 'This receipt has already been used',
                code: SubscriptionErrorCode.ReceiptAlreadyUsed,
            });
        }

        if (outcome.kind === 'unknown-product') {
            // Recorded all the same — somebody paid for this. An error, not a
            // warning: it means the plan table and the store catalogue disagree.
            this.logger.error({
                msg: 'a verified receipt names a product no plan matches',
                userId,
                store: verified.store,
                productId: verified.productId,
                transactionId: verified.transactionId,
            });

            throw new BadRequestException({
                message: 'The receipt names a product this server does not sell',
                code: SubscriptionErrorCode.UnknownProduct,
            });
        }

        if (outcome.kind === 'recorded') {
            this.logger.log({
                msg: 'recorded a receipt that leaves the subscription as it is',
                userId,
                store: verified.store,
                transactionId: verified.transactionId,
                standingSubscriptionId: outcome.subscription.id,
            });
        }

        await this.dismissPaywall(userId);

        // After the commit, and only when this receipt is what switched the
        // subscription on: a retry, or a receipt that changed nothing, has
        // nothing new to announce. The purchase is what must survive; the
        // message about it is not.
        if (outcome.kind === 'opened') {
            await this.notifications.emit(userId, NotificationEvent.SubscriptionActivated, {
                date: outcome.subscription.expiresAt,
            });
        }

        // Every recorded receipt, a retry included: the retry is also the
        // retry of a reward that failed the first time round. Granting is
        // idempotent, so when it already landed this costs one update that
        // matches nothing — and it runs after the buyer's commit, so it can
        // never take the buyer's purchase down with it.
        await this.rewardReferrer(userId);

        if (!outcome.subscription) {
            // A retry of a receipt that opened nothing, on an account with
            // nothing live left: there is no subscription to answer with.
            throw new BadRequestException({
                message: 'This receipt has already been used',
                code: SubscriptionErrorCode.ReceiptAlreadyUsed,
            });
        }

        return outcome.subscription;
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

        // The redemption and the month are one transaction: either both are
        // written or neither. The checks above are for a friendly answer; the
        // rules themselves — one code per account, one live subscription — are
        // the primary key and the index the repository writes against.
        const outcome = await this.subscriptions.redeemReferralCode(
            {
                redeemerUserId: userId,
                referrerUserId,
                code,
                plan: { id: plan.id, priceCents: plan.priceCents, currency: plan.currency },
                startedAt,
                expiresAt: addMonths(startedAt, REFERRAL_REWARD.freeMonths),
            },
            language,
        );

        if (outcome.kind === 'already-redeemed') {
            throw new BadRequestException({
                message: 'This account has already redeemed a referral code',
                code: SubscriptionErrorCode.AlreadyRedeemed,
            });
        }

        if (outcome.kind === 'already-subscribed') {
            throw new BadRequestException({
                message: 'This account already has an active subscription',
                code: SubscriptionErrorCode.AlreadySubscribed,
            });
        }

        await this.dismissPaywall(userId);

        // Both after the commit, and only on the path that wrote something.
        await this.notifications.emit(userId, NotificationEvent.SubscriptionActivated, {
            date: outcome.subscription.expiresAt,
        });

        // The referrer is the one who otherwise never finds out: their screen
        // shows a number that moves with nothing to explain it. Nothing is
        // granted here — the free month this code just gave is not a payment,
        // and rewarding it would pay out for every account anyone cares to make.
        await this.notifications.emit(referrerUserId, NotificationEvent.ReferralRedeemed);

        return outcome.subscription;
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

        // Counted from the grants, not from the conversions: the two differ
        // only while a grant is failing, and then the screen should show what
        // was given rather than what is owed (referral SC-002).
        return { code, stats, monthsEarned: stats.rewarded * REFERRAL_REWARD.freeMonths };
    }

    /**
     * Gives whoever invited this buyer their month, if this purchase is what
     * earns it (referral FR-006, FR-007).
     *
     * Called for every purchase; whether it counts — invited, paid, first time
     * — is decided by the repository in the same statement that claims the
     * reward, so there is no second copy of the rule here to drift.
     *
     * **Never throws.** The buyer's purchase has already happened and must not
     * report failure over somebody else's reward. But unlike a notification, a
     * lost reward is somebody's money: the grant is one transaction, so a
     * failure leaves it unclaimed and the next replay of the receipt tries
     * again — and the failure is logged as an error, not a warning.
     */
    private async rewardReferrer(buyerUserId: string): Promise<void> {
        let reward: GrantedReferralReward | null;

        try {
            reward = await this.subscriptions.grantReferralReward(buyerUserId, {
                planSlug: REFERRAL_REWARD.planSlug,
                extend: from => addMonths(from, REFERRAL_REWARD.freeMonths),
            });
        } catch (error) {
            this.logger.error({ msg: 'failed to grant a referral reward', buyerUserId, error });
            return;
        }

        if (!reward) return;

        this.logger.log({
            msg: 'granted a referral reward',
            buyerUserId,
            referrerUserId: reward.referrerUserId,
            extended: reward.extended,
            // A store-billed subscription lengthened here runs past the date
            // the store will next charge on; see the referral plan.
            store: reward.store,
            expiresAt: reward.expiresAt,
        });

        await this.notifications.emit(reward.referrerUserId, NotificationEvent.ReferralRewarded, {
            date: reward.expiresAt,
        });
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
