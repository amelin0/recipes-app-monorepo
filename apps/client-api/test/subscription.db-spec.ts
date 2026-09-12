import { randomUUID } from 'node:crypto';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { SubscriptionRepository, UserEntity, UserRepository, schema } from '@dns/database';
import {
    BillingPeriod,
    NotificationEvent,
    PurchaseStore,
    SubscriptionSource,
    SubscriptionStatus,
} from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { SubscriptionErrorCode } from '../src/modules/subscription/subscription.errors';
import { SubscriptionService } from '../src/modules/subscription/subscription.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'buyer@example.com';
const OTHER_EMAIL = 'friend@example.com';
const THIRD_EMAIL = 'third@example.com';
const FOURTH_EMAIL = 'fourth@example.com';
const PASSWORD = 'passw0rd';

const APPLE_ANNUAL = 'com.rationfit.application.annual';
const APPLE_MONTHLY = 'com.rationfit.application.monthly';

type LedgerRow = typeof schema.storeTransactions.$inferSelect;
type SubscriptionRow = typeof schema.subscriptions.$inferSelect;

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
    let subscriptionRepository: SubscriptionRepository;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        subscriptions = ctx.moduleRef.get(SubscriptionService);
        subscriptionRepository = ctx.moduleRef.get(SubscriptionRepository);
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

    /** Every transaction recorded for the account — the money, whatever it bought. */
    const ledgerOf = (userId: string): Promise<LedgerRow[]> =>
        ctx.db.select().from(schema.storeTransactions).where(eq(schema.storeTransactions.userId, userId));

    const rowsOf = (userId: string): Promise<SubscriptionRow[]> =>
        ctx.db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));

    const activeRowsOf = (userId: string): Promise<SubscriptionRow[]> =>
        ctx.db
            .select()
            .from(schema.subscriptions)
            .where(
                and(
                    eq(schema.subscriptions.userId, userId),
                    eq(schema.subscriptions.status, SubscriptionStatus.Active),
                ),
            );

    const activationsOf = async (userId: string): Promise<number> => {
        const rows = await ctx.db
            .select({ id: schema.notifications.id })
            .from(schema.notifications)
            .where(
                and(
                    eq(schema.notifications.userId, userId),
                    eq(schema.notifications.event, NotificationEvent.SubscriptionActivated),
                ),
            );

        return rows.length;
    };

    /** The machine-readable code on a refusal; undefined for anything that is not one — a 500 included. */
    const refusalCode = (error: unknown): string | undefined =>
        error instanceof BadRequestException ? (error.getResponse() as { code?: string }).code : undefined;

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

        /**
         * The store has already charged by the time a receipt reaches us, so
         * «already subscribed» is not an answer to one: it used to be, and the
         * transaction was never stored.
         */
        it('records a second purchase rather than refusing it', async () => {
            await buy(user.id, { productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });

            await expect(buy(user.id)).resolves.toBeUndefined();

            expect(await ledgerOf(user.id)).toHaveLength(2);
            expect(await activeRowsOf(user.id)).toHaveLength(1);
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

    /**
     * A receipt that lands on an account with a live row. The rule: the receipt
     * replaces the row when it ends later than what a store billed of it, and
     * brings along whatever of the row no store billed; otherwise it is only
     * recorded. Access never gets shorter, and the money is always written down.
     */
    describe('a receipt on an account that already has a subscription', () => {
        it('an upgrade replaces the month: the year is live, the month closed, both recorded', async () => {
            await buy(user.id, { productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });
            const monthly = (await subscriptions.state(user.id)).subscription;

            const annual = await subscriptions.redeemReceipt(user.id, {
                store: PurchaseStore.Apple,
                receipt: receipt({ expiresAt: inDays(365).toISOString() }),
            });

            expect(annual.planSlug).toBe('annual');
            expect((await subscriptions.state(user.id)).subscription?.id).toBe(annual.id);
            // The store refunds what is left of the month itself, so nothing of
            // it carries over.
            expect(annual.daysRemaining).toBe(365);

            const replaced = (await rowsOf(user.id)).find(row => row.id === monthly?.id);
            expect(replaced?.status).toBe(SubscriptionStatus.Expired);
            expect(replaced?.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());

            const ledger = await ledgerOf(user.id);
            expect(ledger).toHaveLength(2);
            expect(ledger.map(entry => entry.priceCents ?? 0).sort((a, b) => a - b)).toEqual([999, 5999]);
            expect(ledger.find(entry => entry.productId === APPLE_ANNUAL)?.subscriptionId).toBe(annual.id);
            expect(await activationsOf(user.id)).toBe(2);
        });

        it('a purchase over a free referral month keeps what was left of the month', async () => {
            const owner = await register(OTHER_EMAIL);
            const { code } = await subscriptions.referral(owner.id);
            const free = await subscriptions.redeemCode(user.id, code);

            const paid = await subscriptions.redeemReceipt(user.id, {
                store: PurchaseStore.Apple,
                receipt: receipt({ productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() }),
            });

            expect(paid.source).toBe(SubscriptionSource.Purchase);
            expect(paid.planSlug).toBe('monthly');
            // Thirty paid days on top of the free month's remainder, not instead of it.
            const expected = free.expiresAt.getTime() + 30 * 86_400_000;
            expect(Math.abs(paid.expiresAt.getTime() - expected)).toBeLessThan(60_000);

            const rows = await rowsOf(user.id);
            expect(rows).toHaveLength(2);
            expect(rows.find(row => row.id === free.id)?.status).toBe(SubscriptionStatus.Expired);
            expect(await activeRowsOf(user.id)).toHaveLength(1);
        });

        it('a trial converting replaces the trial and carries nothing over', async () => {
            await buy(user.id, { isTrial: true, expiresAt: inDays(7).toISOString() });

            const converted = await subscriptions.redeemReceipt(user.id, {
                store: PurchaseStore.Apple,
                receipt: receipt({ startedAt: inDays(7).toISOString(), expiresAt: inDays(372).toISOString() }),
            });

            expect(converted.source).toBe(SubscriptionSource.Purchase);
            expect(converted.pricePaidCents).toBe(5999);
            expect(converted.daysRemaining).toBe(372);
            expect(await ledgerOf(user.id)).toHaveLength(2);
        });

        it('an older transaction replayed from purchase history is recorded and changes nothing', async () => {
            await buy(user.id);
            const annual = (await subscriptions.state(user.id)).subscription;

            const lapsed = receipt({
                productId: APPLE_MONTHLY,
                startedAt: inDays(-60).toISOString(),
                expiresAt: inDays(-30).toISOString(),
            });
            const shorter = receipt({ productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });

            for (const replayed of [lapsed, shorter]) {
                const answer = await subscriptions.redeemReceipt(user.id, {
                    store: PurchaseStore.Apple,
                    receipt: replayed,
                });

                // The answer is what the account has, and what it has is untouched.
                expect(answer.id).toBe(annual?.id);
            }

            expect((await subscriptions.state(user.id)).subscription?.expiresAt).toEqual(annual?.expiresAt);
            expect(await rowsOf(user.id)).toHaveLength(1);

            const ledger = await ledgerOf(user.id);
            expect(ledger).toHaveLength(3);
            expect(ledger.filter(entry => entry.subscriptionId === null)).toHaveLength(2);
            // Nothing switched on, so nothing was announced.
            expect(await activationsOf(user.id)).toBe(1);
        });

        it('records a transaction for a product this server does not sell, and answers the same on a retry', async () => {
            const unknown = receipt({ productId: 'com.example.something' });

            for (let attempt = 0; attempt < 2; attempt++) {
                const refusal = await subscriptions
                    .redeemReceipt(user.id, { store: PurchaseStore.Apple, receipt: unknown })
                    .catch((error: unknown) => error);

                expect(refusalCode(refusal)).toBe(SubscriptionErrorCode.UnknownProduct);
            }

            const ledger = await ledgerOf(user.id);
            expect(ledger).toHaveLength(1);
            expect(ledger[0]?.planId).toBeNull();
            expect(await rowsOf(user.id)).toHaveLength(0);
        });

        it('honours a receipt for a plan taken off sale — its subscribers still renew', async () => {
            await ctx.db
                .update(schema.subscriptionPlans)
                .set({ isActive: false })
                .where(eq(schema.subscriptionPlans.slug, 'monthly'));

            try {
                await buy(user.id, { productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });

                expect((await subscriptions.state(user.id)).subscription?.planSlug).toBe('monthly');
            } finally {
                await ctx.db
                    .update(schema.subscriptionPlans)
                    .set({ isActive: true })
                    .where(eq(schema.subscriptionPlans.slug, 'monthly'));
            }
        });
    });

    /**
     * The same request twice at once is the ordinary case, not an edge one: the
     * StoreKit listener and the explicit submit both send the receipt, and a
     * double tap sends a code twice. Rounds, because one lucky interleaving
     * proves nothing.
     */
    describe('under concurrent requests', () => {
        const ROUNDS = 3;

        it('the same receipt five times at once on one account is one purchase', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                await truncateAuthTables(ctx.db);
                const buyer = await register(EMAIL);
                const same = receipt();

                const answers = await Promise.all(
                    Array.from({ length: 5 }, () =>
                        subscriptions.redeemReceipt(buyer.id, { store: PurchaseStore.Apple, receipt: same }),
                    ),
                );

                expect(new Set(answers.map(answer => answer.id)).size).toBe(1);
                expect(await rowsOf(buyer.id)).toHaveLength(1);
                expect(await ledgerOf(buyer.id)).toHaveLength(1);
                // Announced once — by the request that switched it on.
                expect(await activationsOf(buyer.id)).toBe(1);
            }
        });

        it('the same receipt on two accounts at once buys one subscription, and the other is told why', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                await truncateAuthTables(ctx.db);
                const first = await register(EMAIL);
                const second = await register(OTHER_EMAIL);
                const shared = receipt();

                const results = await Promise.allSettled([
                    subscriptions.redeemReceipt(first.id, { store: PurchaseStore.Apple, receipt: shared }),
                    subscriptions.redeemReceipt(second.id, { store: PurchaseStore.Apple, receipt: shared }),
                ]);

                expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);

                const refused = results.find(result => result.status === 'rejected');
                expect(refusalCode(refused?.reason)).toBe(SubscriptionErrorCode.ReceiptAlreadyUsed);

                const rows = [...(await rowsOf(first.id)), ...(await rowsOf(second.id))];
                const ledger = [...(await ledgerOf(first.id)), ...(await ledgerOf(second.id))];
                expect(rows).toHaveLength(1);
                expect(ledger).toHaveLength(1);
                expect(ledger[0]?.userId).toBe(rows[0]?.userId);
            }
        });

        it('a purchase racing a code redemption leaves one live row, and it is the purchase', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                await truncateAuthTables(ctx.db);
                const owner = await register(OTHER_EMAIL);
                const buyer = await register(EMAIL);
                const { code } = await subscriptions.referral(owner.id);

                const [redemption, purchase] = await Promise.allSettled([
                    subscriptions.redeemCode(buyer.id, code),
                    subscriptions.redeemReceipt(buyer.id, {
                        store: PurchaseStore.Apple,
                        receipt: receipt({ productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() }),
                    }),
                ]);

                // The purchase never fails; the code may lose, but with a
                // reason rather than a 500.
                expect(purchase.status).toBe('fulfilled');
                if (redemption.status === 'rejected') {
                    expect(refusalCode(redemption.reason)).toBe(SubscriptionErrorCode.AlreadySubscribed);
                    // Refused means not spent: the redemption went with the month.
                    expect(await subscriptionRepository.hasRedeemed(buyer.id)).toBe(false);
                } else {
                    expect(await subscriptionRepository.hasRedeemed(buyer.id)).toBe(true);
                }

                const live = await activeRowsOf(buyer.id);
                expect(live).toHaveLength(1);
                expect(live[0]?.source).toBe(SubscriptionSource.Purchase);
                expect(await ledgerOf(buyer.id)).toHaveLength(1);
            }
        });

        it('two codes spent at once on one account spend one', async () => {
            const firstOwner = await register(OTHER_EMAIL);
            const secondOwner = await register(THIRD_EMAIL);
            const first = await subscriptions.referral(firstOwner.id);
            const second = await subscriptions.referral(secondOwner.id);

            const results = await Promise.allSettled([
                subscriptions.redeemCode(user.id, first.code),
                subscriptions.redeemCode(user.id, second.code),
            ]);

            expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);

            const refused = results.find(result => result.status === 'rejected');
            expect(refusalCode(refused?.reason)).toBe(SubscriptionErrorCode.AlreadyRedeemed);

            expect(await activeRowsOf(user.id)).toHaveLength(1);

            const invited =
                (await subscriptions.referral(firstOwner.id)).stats.invited +
                (await subscriptions.referral(secondOwner.id)).stats.invited;
            expect(invited).toBe(1);
        });
    });

    /**
     * The free month and the redemption that pays for it are one transaction.
     * The old order — month first, redemption after, separate commits — could
     * leave a month granted with nothing spent, and the account free to spend
     * another code.
     */
    describe('a code redemption that fails half-way', () => {
        it('leaves neither the redemption nor the month when the month cannot be written', async () => {
            const owner = await register(OTHER_EMAIL);
            const { code } = await subscriptions.referral(owner.id);
            const startedAt = new Date();

            // A plan that does not exist: the redemption goes in, then the
            // month's insert fails on its foreign key.
            await expect(
                subscriptionRepository.redeemReferralCode(
                    {
                        redeemerUserId: user.id,
                        referrerUserId: owner.id,
                        code,
                        plan: { id: randomUUID(), priceCents: 999, currency: 'USD' },
                        startedAt,
                        expiresAt: inDays(30),
                    },
                    'uk',
                ),
            ).rejects.toThrow();

            expect(await subscriptionRepository.hasRedeemed(user.id)).toBe(false);
            expect(await rowsOf(user.id)).toHaveLength(0);

            // Nothing was spent, so the code still works.
            const granted = await subscriptions.redeemCode(user.id, code);
            expect(granted.source).toBe(SubscriptionSource.Referral);
        });

        it('does not spend the code when the account turns out to be subscribed', async () => {
            const owner = await register(OTHER_EMAIL);
            const { code } = await subscriptions.referral(owner.id);
            await buy(user.id);

            const refusal = await subscriptions.redeemCode(user.id, code).catch((error: unknown) => error);

            expect(refusalCode(refusal)).toBe(SubscriptionErrorCode.AlreadySubscribed);
            expect(await subscriptionRepository.hasRedeemed(user.id)).toBe(false);
            expect((await subscriptions.referral(owner.id)).stats.invited).toBe(0);
        });
    });

    describe('referral codes', () => {
        it('mints a code the first time the screen asks for it, and keeps it', async () => {
            const first = await subscriptions.referral(user.id);
            const second = await subscriptions.referral(user.id);

            expect(first.code).toHaveLength(8);
            expect(second.code).toBe(first.code);
            expect(first.stats).toEqual({ invited: 0, converted: 0, rewarded: 0 });
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

        /**
         * The old count joined the redeemer's subscription rows, so the free
         * month the code itself grants made every redemption «converted» on
         * the spot. With the reward now real, that would pay a month for every
         * account anybody cared to register.
         */
        it('counts the invitation, but not as converted — the free month is not a payment', async () => {
            const owner = await subscriptions.referral(user.id);
            const friend = await register(OTHER_EMAIL);

            await subscriptions.redeemCode(friend.id, owner.code);

            const overview = await subscriptions.referral(user.id);
            expect(overview.stats).toEqual({ invited: 1, converted: 0, rewarded: 0 });
            expect(overview.monthsEarned).toBe(0);
            expect((await subscriptions.state(user.id)).subscription).toBeNull();
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

    /**
     * The referrer's month (referral FR-006): granted when somebody they
     * invited first pays, once per invitation, and never at the cost of the
     * purchase that earned it.
     */
    describe('the referrer’s reward', () => {
        const REWARD_TERMS = {
            planSlug: 'monthly',
            extend: (from: Date) => new Date(from.getTime() + 30 * 86_400_000),
        };

        /**
         * Six weeks ago, as far as the database can tell: the free month the
         * code gave has run out (and the nightly job has marked it), which is
         * the only way a redeemer can buy — while it runs, they already have a
         * subscription.
         */
        const lapseFreeMonth = async (userId: string): Promise<void> => {
            await ctx.db
                .update(schema.subscriptions)
                .set({ startedAt: inDays(-42), expiresAt: inDays(-11), status: SubscriptionStatus.Expired })
                .where(eq(schema.subscriptions.userId, userId));
            await ctx.db
                .update(schema.referralRedemptions)
                .set({ redeemedAt: inDays(-42) })
                .where(eq(schema.referralRedemptions.redeemerUserId, userId));
        };

        /** Somebody who redeemed `referrerId`'s code and whose free month is over. */
        const invitedFriend = async (referrerId: string, email: string): Promise<UserEntity> => {
            const { code } = await subscriptions.referral(referrerId);
            const friend = await register(email);

            await subscriptions.redeemCode(friend.id, code);
            await lapseFreeMonth(friend.id);

            return friend;
        };

        const payMonthly = (userId: string, overrides: Record<string, unknown> = {}): Promise<void> =>
            buy(userId, { productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString(), ...overrides });

        const setMonthlyOnSale = async (onSale: boolean): Promise<void> => {
            await ctx.db
                .update(schema.subscriptionPlans)
                .set({ isActive: onSale })
                .where(eq(schema.subscriptionPlans.slug, 'monthly'));
        };

        it('gives a referrer with no subscription a month on the monthly plan', async () => {
            const friend = await invitedFriend(user.id, OTHER_EMAIL);

            await payMonthly(friend.id);

            const granted = (await subscriptions.state(user.id)).subscription;
            expect(granted?.source).toBe(SubscriptionSource.Referral);
            expect(granted?.planSlug).toBe('monthly');
            expect(granted?.store).toBe(PurchaseStore.None);
            expect(granted?.pricePaidCents).toBe(0);
            expect(granted?.daysRemaining).toBeGreaterThanOrEqual(28);
            expect(granted?.daysRemaining).toBeLessThanOrEqual(31);

            const overview = await subscriptions.referral(user.id);
            expect(granted?.referralCode).toBe(overview.code);
            expect(overview.stats).toEqual({ invited: 1, converted: 1, rewarded: 1 });
            expect(overview.monthsEarned).toBe(1);
        });

        it('lengthens a live subscription by a calendar month — 31 January becomes the end of February', async () => {
            const year = new Date().getUTCFullYear() + 1;
            const endOfJanuary = new Date(Date.UTC(year, 0, 31, 12));
            const endOfFebruary = new Date(Date.UTC(year, 2, 0, 12));

            await buy(user.id, { expiresAt: endOfJanuary.toISOString() });
            const friend = await invitedFriend(user.id, OTHER_EMAIL);

            await payMonthly(friend.id);

            const lengthened = (await subscriptions.state(user.id)).subscription;
            // The same row, still the annual plan the referrer paid for — only
            // its end has moved.
            expect(lengthened?.planSlug).toBe('annual');
            expect(lengthened?.source).toBe(SubscriptionSource.Purchase);
            expect(lengthened?.expiresAt.toISOString()).toBe(endOfFebruary.toISOString());
        });

        it('rewards nothing for a trial', async () => {
            const friend = await invitedFriend(user.id, OTHER_EMAIL);

            await buy(friend.id, { isTrial: true, expiresAt: inDays(7).toISOString() });

            expect((await subscriptions.state(user.id)).subscription).toBeNull();
            expect((await subscriptions.referral(user.id)).stats).toEqual({ invited: 1, converted: 0, rewarded: 0 });
        });

        it('rewards nothing for a purchase made before the code was redeemed', async () => {
            const { code } = await subscriptions.referral(user.id);
            const friend = await register(OTHER_EMAIL);

            // Already a customer, lapsed, then took a friend's free month.
            await buy(friend.id, { startedAt: inDays(-400).toISOString(), expiresAt: inDays(-30).toISOString() });
            await subscriptions.redeemCode(friend.id, code);

            expect((await subscriptions.state(user.id)).subscription).toBeNull();
            expect((await subscriptions.referral(user.id)).stats).toEqual({ invited: 1, converted: 0, rewarded: 0 });
        });

        it('rewards a friend once, however often they pay or the receipt is replayed', async () => {
            const friend = await invitedFriend(user.id, OTHER_EMAIL);
            const first = receipt({ productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });

            await subscriptions.redeemReceipt(friend.id, { store: PurchaseStore.Apple, receipt: first });
            const once = (await subscriptions.state(user.id)).subscription;

            await subscriptions.redeemReceipt(friend.id, { store: PurchaseStore.Apple, receipt: first });

            // A second, later purchase by the same friend earns nothing either.
            await ctx.db
                .update(schema.subscriptions)
                .set({ expiresAt: inDays(-1) })
                .where(eq(schema.subscriptions.userId, friend.id));
            await payMonthly(friend.id);

            const after = (await subscriptions.state(user.id)).subscription;
            expect(after?.id).toBe(once?.id);
            expect(after?.expiresAt.toISOString()).toBe(once?.expiresAt.toISOString());

            const overview = await subscriptions.referral(user.id);
            expect(overview.stats).toEqual({ invited: 1, converted: 1, rewarded: 1 });
            expect(overview.monthsEarned).toBe(1);
        });

        /**
         * The claim is a conditional update on a row the primary key makes
         * unique, so two grants racing for the same invitation cannot both
         * win — no check in the service is involved.
         */
        it('cannot be granted twice for one invitation, even concurrently', async () => {
            const friend = await invitedFriend(user.id, OTHER_EMAIL);
            await ctx.db.insert(schema.subscriptions).values({
                userId: friend.id,
                planId: (await subscriptionRepository.findPlanBySlug('monthly', 'uk'))!.id,
                source: SubscriptionSource.Purchase,
                status: SubscriptionStatus.Active,
                startedAt: new Date(),
                expiresAt: inDays(30),
                pricePaidCents: 999,
                currency: 'USD',
                store: PurchaseStore.Apple,
                storeTransactionId: 'txn-race',
            });

            const results = await Promise.all([
                subscriptionRepository.grantReferralReward(friend.id, REWARD_TERMS),
                subscriptionRepository.grantReferralReward(friend.id, REWARD_TERMS),
            ]);

            expect(results.filter(result => result !== null)).toHaveLength(1);
            expect((await subscriptions.referral(user.id)).stats.rewarded).toBe(1);
        });

        /**
         * Two friends converting at the same moment must give two months. Both
         * grants read the referrer's end date; without the lock one would
         * overwrite the other, or both would insert and the second would hit
         * the one-active-per-account index.
         */
        it('gives two months when two friends pay at the same time', async () => {
            const friendA = await invitedFriend(user.id, OTHER_EMAIL);
            const friendB = await invitedFriend(user.id, THIRD_EMAIL);

            await Promise.all([payMonthly(friendA.id), payMonthly(friendB.id)]);

            const granted = (await subscriptions.state(user.id)).subscription;
            expect(granted?.daysRemaining).toBeGreaterThanOrEqual(58);
            expect(granted?.daysRemaining).toBeLessThanOrEqual(62);

            const overview = await subscriptions.referral(user.id);
            expect(overview.stats).toEqual({ invited: 2, converted: 2, rewarded: 2 });
            expect(overview.monthsEarned).toBe(2);
        });

        /**
         * The grant is one transaction with its claim. Failing half-way — here
         * because the plan a fresh reward lands on is off sale — must leave the
         * invitation unrewarded rather than recorded as rewarded with nothing
         * given; and the buyer's own purchase must not notice at all.
         */
        it('never fails the purchase, and leaves a failed grant to be retried', async () => {
            const friend = await invitedFriend(user.id, OTHER_EMAIL);
            const annual = receipt();

            await setMonthlyOnSale(false);
            try {
                await expect(
                    subscriptions.redeemReceipt(friend.id, { store: PurchaseStore.Apple, receipt: annual }),
                ).resolves.toBeDefined();

                expect((await subscriptions.state(friend.id)).subscription?.planSlug).toBe('annual');
                expect((await subscriptions.state(user.id)).subscription).toBeNull();

                // Owed, not given — and the screen says what was given.
                const owed = await subscriptions.referral(user.id);
                expect(owed.stats).toEqual({ invited: 1, converted: 1, rewarded: 0 });
                expect(owed.monthsEarned).toBe(0);
            } finally {
                await setMonthlyOnSale(true);
            }

            // The client retrying the receipt is the retry of the grant.
            await subscriptions.redeemReceipt(friend.id, { store: PurchaseStore.Apple, receipt: annual });

            expect((await subscriptions.state(user.id)).subscription?.source).toBe(SubscriptionSource.Referral);
            expect((await subscriptions.referral(user.id)).monthsEarned).toBe(1);
        });

        /**
         * The referrer's own purchase and the reward their friend's payment
         * earns both write the referrer's subscription. They used to queue on
         * different things, so both could find nothing live and both insert —
         * and one lost to the one-active index with a 500. Both orders now end
         * in the same place: the purchase, with the month on top.
         */
        it('a referrer buying while their friend pays gets the purchase and the month, in either order', async () => {
            for (let round = 0; round < 3; round++) {
                await truncateAuthTables(ctx.db);
                const referrer = await register(EMAIL);
                const friend = await invitedFriend(referrer.id, OTHER_EMAIL);

                await Promise.all([buy(referrer.id), payMonthly(friend.id)]);

                const live = await activeRowsOf(referrer.id);
                expect(live).toHaveLength(1);
                expect(live[0]?.source).toBe(SubscriptionSource.Purchase);

                const state = (await subscriptions.state(referrer.id)).subscription;
                expect(state?.planSlug).toBe('annual');
                expect(state?.daysRemaining).toBeGreaterThanOrEqual(365 + 28);
                expect(state?.daysRemaining).toBeLessThanOrEqual(365 + 31);

                expect(await ledgerOf(referrer.id)).toHaveLength(1);
                expect((await subscriptions.referral(referrer.id)).stats.rewarded).toBe(1);
            }
        });

        /**
         * A reward lengthens a store-billed row past the store's date. The
         * store's renewal then used to be refused (the row was still live) and
         * the month was absorbed by a period the customer paid for. Now the
         * renewal replaces the row and brings the unbilled month along.
         */
        it('a renewal carries a reward month over rather than absorbing it', async () => {
            await buy(user.id, { productId: APPLE_MONTHLY, expiresAt: inDays(30).toISOString() });
            const friend = await invitedFriend(user.id, OTHER_EMAIL);
            await payMonthly(friend.id);

            const renewed = await subscriptions.redeemReceipt(user.id, {
                store: PurchaseStore.Apple,
                receipt: receipt({
                    productId: APPLE_MONTHLY,
                    startedAt: inDays(30).toISOString(),
                    expiresAt: inDays(60).toISOString(),
                }),
            });

            expect(renewed.source).toBe(SubscriptionSource.Purchase);
            // Sixty billed days plus the calendar month the reward added.
            expect(renewed.daysRemaining).toBeGreaterThanOrEqual(60 + 28);
            expect(renewed.daysRemaining).toBeLessThanOrEqual(60 + 31);
            expect(await ledgerOf(user.id)).toHaveLength(2);
            expect(await activeRowsOf(user.id)).toHaveLength(1);
        });

        it('rewards only the referrer of the friend who paid', async () => {
            const bystander = await register(FOURTH_EMAIL);
            const friend = await invitedFriend(user.id, OTHER_EMAIL);
            await invitedFriend(bystander.id, THIRD_EMAIL);

            await payMonthly(friend.id);

            expect((await subscriptions.state(user.id)).subscription).not.toBeNull();
            expect((await subscriptions.state(bystander.id)).subscription).toBeNull();
            expect((await subscriptions.referral(bystander.id)).stats).toEqual({
                invited: 1,
                converted: 0,
                rewarded: 0,
            });
        });
    });
});
