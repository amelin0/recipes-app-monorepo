import { eq, like, sql } from 'drizzle-orm';

import { schema } from '@dns/database';
import {
    NotificationEvent,
    OtpPurpose,
    PurchaseStore,
    SubscriptionSource,
    SubscriptionStatus,
    Theme,
} from '@dns/shared-types';

import { ExpiredRowsService } from '../src/jobs/cleanup/expired-rows.service';
import { SubscriptionExpiryService } from '../src/jobs/subscription/subscription-expiry.service';

import { WorkerTestContext, createWorkerTestContext } from './support/testing-module';

const DOMAIN = '@worker.test';
const DAY = 86_400_000;

describe('background jobs', () => {
    let context: WorkerTestContext;
    let cleanup: ExpiredRowsService;
    let expiry: SubscriptionExpiryService;

    beforeAll(async () => {
        context = await createWorkerTestContext();
        cleanup = context.moduleRef.get(ExpiredRowsService);
        expiry = context.moduleRef.get(SubscriptionExpiryService);
    });

    afterAll(async () => {
        try {
            await removeTestUsers(context);
        } finally {
            await context.close();
        }
    });

    beforeEach(async () => {
        await removeTestUsers(context);
    });

    describe('sweeping expired rows', () => {
        it('deletes what has expired and keeps what has not', async () => {
            const userId = await createUser(context, `sweep${DOMAIN}`);

            await createRefreshToken(context, userId, { expiresIn: -DAY });
            await createRefreshToken(context, userId, { expiresIn: DAY });
            await createOtpCode(context, userId, { expiresIn: -DAY });
            await createPermit(context, userId, { expiresIn: -DAY });

            const report = await cleanup.run();

            expect(report.refreshTokens).toBeGreaterThanOrEqual(1);
            expect(report.otpCodes).toBeGreaterThanOrEqual(1);
            expect(report.passwordResetPermits).toBeGreaterThanOrEqual(1);

            const tokens = await context.db
                .select()
                .from(schema.refreshTokens)
                .where(eq(schema.refreshTokens.userId, userId));
            expect(tokens).toHaveLength(1);
        });

        /**
         * The queue promises «at least once», so every job has to survive
         * being run twice. This one does by construction — it deletes by a
         * predicate on time — and that is worth a test rather than a comment.
         */
        it('is safe to run twice', async () => {
            const userId = await createUser(context, `twice${DOMAIN}`);
            await createRefreshToken(context, userId, { expiresIn: -DAY });

            const first = await cleanup.run();
            const second = await cleanup.run();

            expect(first.refreshTokens).toBeGreaterThanOrEqual(1);
            expect(second.refreshTokens).toBe(0);
        });
    });

    describe('subscriptions that ran out', () => {
        it('marks them expired and tells the owner', async () => {
            const userId = await createUser(context, `lapsed${DOMAIN}`);
            await giveSubscription(context, userId, { expiresIn: -DAY });

            const report = await expiry.run();

            expect(report.expired).toBe(1);

            const [row] = await context.db
                .select({ status: schema.subscriptions.status })
                .from(schema.subscriptions)
                .where(eq(schema.subscriptions.userId, userId));
            expect(row?.status).toBe(SubscriptionStatus.Expired);

            expect(await eventsOf(context, userId)).toContain(NotificationEvent.SubscriptionExpired);
        });

        it('leaves a live subscription alone', async () => {
            const userId = await createUser(context, `live${DOMAIN}`);
            await giveSubscription(context, userId, { expiresIn: 30 * DAY });

            const report = await expiry.run();

            expect(report.expired).toBe(0);
            expect(await eventsOf(context, userId)).not.toContain(NotificationEvent.SubscriptionExpired);
        });
    });

    describe('subscriptions about to run out', () => {
        it('warns once, inside the window', async () => {
            const userId = await createUser(context, `soon${DOMAIN}`);
            await giveSubscription(context, userId, { expiresIn: 2 * DAY });

            const report = await expiry.run();

            expect(report.warned).toBe(1);
            expect(await eventsOf(context, userId)).toContain(NotificationEvent.SubscriptionExpiring);
        });

        /**
         * The job runs nightly and the window is three days wide, so the same
         * subscription qualifies three nights running. Saying it three times
         * is how a useful warning becomes noise — and there is no «notified»
         * column, so this is read back from the inbox itself.
         */
        it('does not repeat itself on the next night', async () => {
            const userId = await createUser(context, `once${DOMAIN}`);
            await giveSubscription(context, userId, { expiresIn: 2 * DAY });

            await expiry.run();
            const second = await expiry.run();

            expect(second.warned).toBe(0);

            const warnings = (await eventsOf(context, userId)).filter(
                event => event === NotificationEvent.SubscriptionExpiring,
            );
            expect(warnings).toHaveLength(1);
        });

        it('says nothing about one that runs out next month', async () => {
            const userId = await createUser(context, `later${DOMAIN}`);
            await giveSubscription(context, userId, { expiresIn: 30 * DAY });

            const report = await expiry.run();

            expect(report.warned).toBe(0);
        });
    });
});

async function eventsOf(context: WorkerTestContext, userId: string): Promise<(string | null)[]> {
    const rows = await context.db
        .select({ event: schema.notifications.event })
        .from(schema.notifications)
        .where(eq(schema.notifications.userId, userId));

    return rows.map(row => row.event);
}

async function createUser(context: WorkerTestContext, email: string): Promise<string> {
    const [row] = await context.db
        .insert(schema.users)
        .values({ email, passwordHash: 'not-a-real-hash', emailVerifiedAt: new Date() })
        .returning({ id: schema.users.id });

    const id = row!.id;

    await context.db.insert(schema.userSettings).values({
        userId: id,
        language: 'uk',
        theme: Theme.System,
        massUnit: 'kg',
        productWeightUnit: 'g',
        lengthUnit: 'cm',
        waterUnit: 'ml',
    });

    return id;
}

async function createRefreshToken(
    context: WorkerTestContext,
    userId: string,
    options: { expiresIn: number },
): Promise<void> {
    await context.db.insert(schema.refreshTokens).values({
        userId,
        familyId: crypto.randomUUID(),
        tokenHash: 'x',
        expiresAt: new Date(Date.now() + options.expiresIn),
    });
}

async function createOtpCode(
    context: WorkerTestContext,
    userId: string,
    options: { expiresIn: number },
): Promise<void> {
    await context.db.insert(schema.otpCodes).values({
        userId,
        purpose: OtpPurpose.EmailVerification,
        codeHash: 'x',
        expiresAt: new Date(Date.now() + options.expiresIn),
    });
}

async function createPermit(
    context: WorkerTestContext,
    userId: string,
    options: { expiresIn: number },
): Promise<void> {
    await context.db.insert(schema.passwordResetPermits).values({
        userId,
        expiresAt: new Date(Date.now() + options.expiresIn),
    });
}

async function giveSubscription(
    context: WorkerTestContext,
    userId: string,
    options: { expiresIn: number },
): Promise<void> {
    const [plan] = await context.db.select({ id: schema.subscriptionPlans.id }).from(schema.subscriptionPlans).limit(1);

    await context.db.insert(schema.subscriptions).values({
        userId,
        planId: plan!.id,
        source: SubscriptionSource.Purchase,
        status: SubscriptionStatus.Active,
        startedAt: new Date(Date.now() - 30 * DAY),
        expiresAt: new Date(Date.now() + options.expiresIn),
        pricePaidCents: 999,
        currency: 'UAH',
        store: PurchaseStore.Apple,
        storeTransactionId: `txn-${userId}`,
    });
}

/**
 * Deletes only this suite's accounts. Everything the jobs touch hangs off a
 * user by a cascading key, so removing them takes tokens, codes, permits,
 * subscriptions and notifications with them — and leaves the other suites'
 * fixtures where they were.
 */
async function removeTestUsers(context: WorkerTestContext): Promise<void> {
    await context.db.delete(schema.users).where(like(schema.users.email, sql`${`%${DOMAIN}`}`));
}
