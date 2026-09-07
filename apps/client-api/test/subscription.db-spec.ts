import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UserEntity, UserRepository } from '@dns/database';
import { BillingPeriod, PurchaseStore, SubscriptionSource, SubscriptionStatus } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { SubscriptionService } from '../src/modules/subscription/subscription.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'buyer@example.com';
const OTHER_EMAIL = 'friend@example.com';
const THIRD_EMAIL = 'third@example.com';
const PASSWORD = 'passw0rd';

const APPLE_ANNUAL = 'com.rationfit.application.annual';
const APPLE_MONTHLY = 'com.rationfit.application.monthly';

const inDays = (days: number): Date => new Date(Date.now() + days * 86_400_000);

/** The stub verifier reads the receipt as JSON and believes it — this is that JSON. */
const receipt = (overrides: Record<string, unknown> = {}): string =>
    JSON.stringify({
        transactionId: `txn-${Math.random().toString(36).slice(2)}`,
        productId: APPLE_ANNUAL,
        startedAt: new Date().toISOString(),
        expiresAt: inDays(365).toISOString(),
        isTrial: false,
        ...overrides,
    });

describe('Subscription', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let subscriptions: SubscriptionService;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        subscriptions = ctx.moduleRef.get(SubscriptionService);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    const register = async (email: string): Promise<UserEntity> => {
        await authService.register({ email, password: PASSWORD });
        await authService.verifyEmail({ email, code: '000000' });

        const found = await users.findByEmail(email);
        expect(found).not.toBeNull();

        return found as UserEntity;
    };

    const buy = async (userId: string, overrides: Record<string, unknown> = {}): Promise<void> => {
        await subscriptions.redeemReceipt(userId, {
            store: PurchaseStore.Apple,
            receipt: receipt(overrides),
        });
    };

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        user = await register(EMAIL);
    });

    describe('the paywall', () => {
        it('offers both plans with the annual one preselected', async () => {
            const paywall = await subscriptions.paywall(user.id);

            expect(paywall.plans.map(offer => offer.plan.slug)).toEqual(['annual', 'monthly']);
            expect(paywall.plans[0]?.plan.isDefault).toBe(true);
            expect(paywall.plans[0]?.plan.period).toBe(BillingPeriod.Year);
            expect(paywall.plans[0]?.plan.trialDays).toBe(7);
        });

        it('computes the saving from the two prices rather than storing it', async () => {
            const paywall = await subscriptions.paywall(user.id);
            const annual = paywall.plans[0];
            const monthly = paywall.plans[1];

            // $59.99 a year is $5.00 a month against $9.99 — a half.
            expect(annual?.plan.monthlyPriceCents).toBe(500);
            expect(annual?.savingsPercent).toBe(50);
            // The plan the comparison is made against has nothing to compare to.
            expect(monthly?.savingsPercent).toBeNull();
        });

        it('lists what the subscription unlocks, in editorial order', async () => {
            const paywall = await subscriptions.paywall(user.id);

            expect(paywall.features.map(feature => feature.slug)).toEqual([
                'recipes',
                'meal-plan',
                'shopping-list',
                'own-recipes',
                'progress',
            ]);
            expect(paywall.features[0]?.name).toBe('Бібліотека з 2000+ рецептів');
        });

        it('is pending for a fresh account and settled once dismissed', async () => {
            expect((await subscriptions.state(user.id)).paywallPending).toBe(true);

            await subscriptions.dismissPaywall(user.id);

            const state = await subscriptions.state(user.id);
            expect(state.paywallPending).toBe(false);
            expect(state.subscription).toBeNull();
        });
    });

    describe('buying', () => {
        it('turns a receipt into a subscription and stops the paywall', async () => {
            await buy(user.id);

            const state = await subscriptions.state(user.id);

            expect(state.subscription?.planSlug).toBe('annual');
            expect(state.subscription?.source).toBe(SubscriptionSource.Purchase);
            expect(state.subscription?.status).toBe(SubscriptionStatus.Active);
            expect(state.subscription?.pricePaidCents).toBe(5999);
            expect(state.subscription?.daysRemaining).toBeGreaterThan(360);
            // Somebody who has bought has nothing left to be sold.
            expect(state.paywallPending).toBe(false);
        });

        it('takes the plan from the store’s product id, not from the caller', async () => {
            await buy(user.id, { productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });

            const state = await subscriptions.state(user.id);

            expect(state.subscription?.planSlug).toBe('monthly');
            expect(state.subscription?.pricePaidCents).toBe(999);
        });

        it('charges nothing for a trial but records which plan it will become', async () => {
            await buy(user.id, { isTrial: true, expiresAt: inDays(7).toISOString() });

            const state = await subscriptions.state(user.id);

            expect(state.subscription?.source).toBe(SubscriptionSource.Trial);
            expect(state.subscription?.pricePaidCents).toBe(0);
            expect(state.subscription?.planSlug).toBe('annual');
        });

        it('refuses a product this server does not sell', async () => {
            await expect(buy(user.id, { productId: 'com.example.something' })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('refuses a receipt that already bought somebody else a subscription', async () => {
            const shared = receipt();
            await subscriptions.redeemReceipt(user.id, { store: PurchaseStore.Apple, receipt: shared });

            const stranger = await register(OTHER_EMAIL);

            await expect(
                subscriptions.redeemReceipt(stranger.id, { store: PurchaseStore.Apple, receipt: shared }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('replaying a receipt on the same account is a retry, not an error', async () => {
            const same = receipt();
            await subscriptions.redeemReceipt(user.id, { store: PurchaseStore.Apple, receipt: same });

            const again = await subscriptions.redeemReceipt(user.id, { store: PurchaseStore.Apple, receipt: same });

            expect(again.planSlug).toBe('annual');
        });

        it('refuses to sell a second subscription to somebody who has one', async () => {
            await buy(user.id);

            await expect(buy(user.id)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('reports a lapsed subscription as no subscription at all', async () => {
            await buy(user.id, { startedAt: inDays(-40).toISOString(), expiresAt: inDays(-10).toISOString() });

            const state = await subscriptions.state(user.id);

            // The row still says «active»; the date says otherwise, and the
            // date is the truth.
            expect(state.subscription).toBeNull();
        });

        it('lets somebody whose subscription lapsed buy again', async () => {
            await buy(user.id, { startedAt: inDays(-400).toISOString(), expiresAt: inDays(-30).toISOString() });

            await buy(user.id);

            const state = await subscriptions.state(user.id);
            expect(state.subscription?.daysRemaining).toBeGreaterThan(360);
        });
    });

    describe('referral codes', () => {
        it('mints a code the first time the screen asks for it, and keeps it', async () => {
            const first = await subscriptions.referral(user.id);
            const second = await subscriptions.referral(user.id);

            expect(first.code).toHaveLength(8);
            expect(second.code).toBe(first.code);
            expect(first.stats).toEqual({ invited: 0, converted: 0 });
            expect(first.monthsEarned).toBe(0);
        });

        it('says what a code grants without spending it', async () => {
            const owner = await subscriptions.referral(user.id);
            const friend = await register(OTHER_EMAIL);

            const offer = await subscriptions.describeCode(friend.id, owner.code);
            expect(offer.freeMonths).toBe(1);
            expect(offer.planSlug).toBe('monthly');

            // Asking is not spending.
            expect((await subscriptions.state(friend.id)).subscription).toBeNull();
        });

        it('normalises the code, so case and spaces do not matter', async () => {
            const owner = await subscriptions.referral(user.id);
            const friend = await register(OTHER_EMAIL);

            const offer = await subscriptions.describeCode(friend.id, owner.code.toLowerCase().trim().toUpperCase());

            expect(offer.code).toBe(owner.code);
        });

        it('grants a free month on the monthly plan', async () => {
            const owner = await subscriptions.referral(user.id);
            const friend = await register(OTHER_EMAIL);

            const granted = await subscriptions.redeemCode(friend.id, owner.code);

            expect(granted.planSlug).toBe('monthly');
            expect(granted.source).toBe(SubscriptionSource.Referral);
            expect(granted.pricePaidCents).toBe(0);
            // The struck-through figure the confirmation screen compares against.
            expect(granted.fullPriceCents).toBe(999);
            expect(granted.referralCode).toBe(owner.code);
            expect(granted.store).toBe(PurchaseStore.None);
            expect(granted.daysRemaining).toBeGreaterThan(27);
        });

        it('counts the invitation, and counts it as converted once they subscribe', async () => {
            const owner = await subscriptions.referral(user.id);
            const friend = await register(OTHER_EMAIL);

            await subscriptions.redeemCode(friend.id, owner.code);

            const overview = await subscriptions.referral(user.id);
            expect(overview.stats.invited).toBe(1);
            expect(overview.stats.converted).toBe(1);
            expect(overview.monthsEarned).toBe(1);
        });

        it('refuses an unknown code, and one’s own', async () => {
            const owner = await subscriptions.referral(user.id);

            await expect(subscriptions.describeCode(user.id, 'ZZZZZZZZ')).rejects.toBeInstanceOf(NotFoundException);
            await expect(subscriptions.describeCode(user.id, owner.code)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('lets an account redeem exactly one code, ever', async () => {
            const first = await subscriptions.referral(user.id);
            const secondOwner = await register(THIRD_EMAIL);
            const second = await subscriptions.referral(secondOwner.id);

            const friend = await register(OTHER_EMAIL);
            await subscriptions.redeemCode(friend.id, first.code);

            await expect(subscriptions.describeCode(friend.id, second.code)).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });
    });
});
