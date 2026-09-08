import { eq, inArray, like, sql } from 'drizzle-orm';

import { schema } from '@dns/database';
import {
    ContentSource,
    Language,
    FeedbackStatus,
    FeedbackType,
    PurchaseStore,
    SubscriptionSource,
    SubscriptionStatus,
    Theme,
} from '@dns/shared-types';
import { adminOverviewQuerySchema } from '@dns/validation';

import { AdminStatsService } from '../src/modules/stats/stats.service';

import { AdminTestContext, createAdminTestContext } from './support/testing-module';

const DOMAIN = '@dashboard-stats.test';
const DAY = 24 * 60 * 60 * 1000;

/**
 * Ids of everything this suite inserts.
 *
 * Aggregates read the whole database, which is also shared with the client
 * suite — so cleanup deletes by id, never «all recipes». Recipes and products
 * arrive with migrations and seeds, and taking them out here would break
 * somebody else's run, hours later and somewhere else.
 */
const created = { recipes: [] as string[], products: [] as string[], tickets: [] as string[] };

describe('admin dashboard stats', () => {
    let context: AdminTestContext;
    let stats: AdminStatsService;

    beforeAll(async () => {
        context = await createAdminTestContext();
        stats = context.moduleRef.get(AdminStatsService);
    });

    afterAll(async () => {
        try {
            await cleanUp(context);
        } finally {
            await context.close();
        }
    });

    beforeEach(async () => {
        await cleanUp(context);
    });

    describe('registrations', () => {
        /**
         * FR-005. A missing day shifts every bar after it and misreports the
         * shape of growth — which is the only thing this chart is read for.
         */
        it('returns every day of the period, zeros included', async () => {
            await createUser(context, `today${DOMAIN}`);

            const overview = await stats.overview(period(7));

            expect(overview.registrations.byDate).toHaveLength(7);
            expect(overview.registrations.byDate.filter(day => day.count === 0).length).toBeGreaterThan(0);
            expect(overview.registrations.byDate.at(-1)?.count).toBeGreaterThanOrEqual(1);
        });

        it('counts only the period asked for', async () => {
            // Measured against a baseline: the database is shared, so the only
            // honest assertion is about the difference this test makes.
            const weekBefore = (await stats.overview(period(7))).registrations.total;
            const quarterBefore = (await stats.overview(period(90))).registrations.total;

            await createUser(context, `old${DOMAIN}`, { createdAt: new Date(Date.now() - 40 * DAY) });
            await createUser(context, `recent${DOMAIN}`);

            const week = await stats.overview(period(7));
            const quarter = await stats.overview(period(90));

            // The 40-day-old account is inside the quarter and outside the week.
            expect(week.registrations.total).toBe(weekBefore + 1);
            expect(quarter.registrations.total).toBe(quarterBefore + 2);
        });

        /**
         * FR-006: an account that never got settings is a normal state, and an
         * inner join would drop it — the breakdown would then quietly stop
         * adding up to the total.
         */
        it('counts an account with no settings as an unset language', async () => {
            await createUser(context, `nolang${DOMAIN}`, { withSettings: false });

            const overview = await stats.overview(period(7));
            const unset = overview.registrations.byLanguage.find(row => row.language === null);

            expect(unset?.count).toBeGreaterThanOrEqual(1);
            expect(sumOf(overview.registrations.byLanguage)).toBe(overview.users.total);
        });
    });

    describe('the headline numbers', () => {
        it('counts blocked accounts and active subscriptions', async () => {
            const blocked = await createUser(context, `blocked${DOMAIN}`);
            await context.db.update(schema.users).set({ blockedAt: new Date() }).where(eq(schema.users.id, blocked));

            const paying = await createUser(context, `paying${DOMAIN}`);
            await giveSubscription(context, paying);

            const overview = await stats.overview(period(7));

            expect(overview.users.blocked).toBeGreaterThanOrEqual(1);
            expect(overview.users.withActiveSubscription).toBeGreaterThanOrEqual(1);
        });

        /**
         * FR-009. A dashboard number that disagrees with the list behind it is
         * worse than no number: it makes both untrustworthy.
         */
        it('excludes archived products, exactly as the products page does', async () => {
            const before = (await stats.overview(period(7))).catalogue.products;
            const id = await createProduct(context, 'Стат-продукт');

            expect((await stats.overview(period(7))).catalogue.products).toBe(before + 1);

            await context.db
                .update(schema.products)
                .set({ archivedAt: new Date() })
                .where(eq(schema.products.id, id));

            expect((await stats.overview(period(7))).catalogue.products).toBe(before);
        });

        it('counts unverified custom products', async () => {
            const before = (await stats.overview(period(7))).catalogue.unverifiedCustomProducts;
            await createProduct(context, 'Чужий продукт', { source: ContentSource.Custom, isVerified: false });

            expect((await stats.overview(period(7))).catalogue.unverifiedCustomProducts).toBe(before + 1);
        });
    });

    describe('the queues', () => {
        it('counts tickets nobody has touched', async () => {
            const before = (await stats.overview(period(7))).queues.newTickets;
            await createTicket(context, FeedbackStatus.New);
            await createTicket(context, FeedbackStatus.Resolved);

            expect((await stats.overview(period(7))).queues.newTickets).toBe(before + 1);
        });

        it('counts only deletion requests that are past their date and still open', async () => {
            const overdue = await createUser(context, `overdue${DOMAIN}`);
            const waiting = await createUser(context, `waiting${DOMAIN}`);
            const cancelled = await createUser(context, `cancelled${DOMAIN}`);

            await requestDeletion(context, overdue, -1);
            await requestDeletion(context, waiting, 30);
            await requestDeletion(context, cancelled, -1, { cancelled: true });

            expect((await stats.overview(period(7))).queues.overdueDeletions).toBe(1);
        });
    });

    describe('favourites', () => {
        it('ranks dishes by how often they are kept, and splits by language', async () => {
            const uk = await createUser(context, `uk${DOMAIN}`, { language: 'uk' });
            const en = await createUser(context, `en${DOMAIN}`, { language: 'en' });

            const popular = await createRecipe(context, 'Популярна');
            const other = await createRecipe(context, 'Менш популярна');

            await favourite(context, popular, [uk, en]);
            await favourite(context, other, [uk]);

            const page = await stats.favorites({ language: Language.Ukrainian, page: 1, limit: 20 });
            const names = page.items.map(item => item.name);

            expect(names.indexOf('Популярна')).toBeLessThan(names.indexOf('Менш популярна'));

            const top = page.items.find(item => item.name === 'Популярна');
            expect(top?.favorites).toBe(2);
            expect(sumOf(top?.byLanguage ?? [])).toBe(2);
            expect(top?.byLanguage.map(row => row.language).sort()).toEqual(['en', 'uk']);
        });

        /** FR-011: what someone saves is personal — the editor gets numbers, not names. */
        it('carries nobody’s identity', async () => {
            const user = await createUser(context, `private${DOMAIN}`);
            const recipe = await createRecipe(context, 'Приватна');
            await favourite(context, recipe, [user]);

            const page = await stats.favorites({ language: Language.Ukrainian, page: 1, limit: 20 });
            const serialised = JSON.stringify(page.items);

            expect(serialised).not.toContain(user);
            expect(serialised).not.toContain(`private${DOMAIN}`);
        });

        it('leaves out dishes nobody kept', async () => {
            await createRecipe(context, 'Нікому не потрібна');

            const page = await stats.favorites({ language: Language.Ukrainian, page: 1, limit: 100 });

            expect(page.items.map(item => item.name)).not.toContain('Нікому не потрібна');
        });
    });

    describe('the period', () => {
        it('accepts only the three the screen has buttons for', () => {
            expect(adminOverviewQuerySchema.safeParse({ days: 30 }).success).toBe(true);
            expect(adminOverviewQuerySchema.safeParse({ days: 1 }).success).toBe(false);
            expect(adminOverviewQuerySchema.safeParse({ days: 365 }).success).toBe(false);
            expect(adminOverviewQuerySchema.parse({}).days).toBe(7);
        });
    });
});

type OverviewQuery = Parameters<AdminStatsService['overview']>[0];

const period = (days: number): OverviewQuery => ({ days }) as OverviewQuery;

const sumOf = (rows: { count: number }[]): number => rows.reduce((total, row) => total + row.count, 0);

async function createUser(
    context: AdminTestContext,
    email: string,
    options: { createdAt?: Date; withSettings?: boolean; language?: string } = {},
): Promise<string> {
    const [row] = await context.db
        .insert(schema.users)
        .values({
            email,
            passwordHash: 'not-a-real-hash',
            emailVerifiedAt: new Date(),
            ...(options.createdAt ? { createdAt: options.createdAt } : {}),
        })
        .returning({ id: schema.users.id });

    const id = row!.id;

    if (options.withSettings !== false) {
        await context.db.insert(schema.userSettings).values({
            userId: id,
            language: options.language ?? 'uk',
            theme: Theme.System,
            massUnit: 'kg',
            productWeightUnit: 'g',
            lengthUnit: 'cm',
            waterUnit: 'ml',
        });
    }

    return id;
}

async function giveSubscription(context: AdminTestContext, userId: string): Promise<void> {
    const [plan] = await context.db.select({ id: schema.subscriptionPlans.id }).from(schema.subscriptionPlans).limit(1);

    await context.db.insert(schema.subscriptions).values({
        userId,
        planId: plan!.id,
        source: SubscriptionSource.Purchase,
        status: SubscriptionStatus.Active,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * DAY),
        pricePaidCents: 999,
        currency: 'UAH',
        store: PurchaseStore.Apple,
        storeTransactionId: `txn-${userId}`,
    });
}

async function createProduct(
    context: AdminTestContext,
    name: string,
    options: { source?: ContentSource; isVerified?: boolean } = {},
): Promise<string> {
    const [row] = await context.db
        .insert(schema.products)
        .values({
            source: options.source ?? ContentSource.Global,
            isVerified: options.isVerified ?? true,
            caloriesPer100g: '10.00',
            proteinPer100g: '1.00',
            fatsPer100g: '1.00',
            carbsPer100g: '1.00',
        })
        .returning({ id: schema.products.id });

    await context.db
        .insert(schema.productTranslations)
        .values({ productId: row!.id, language: 'uk', name });

    created.products.push(row!.id);

    return row!.id;
}

async function createRecipe(context: AdminTestContext, title: string): Promise<string> {
    const [row] = await context.db
        .insert(schema.recipes)
        .values({
            source: ContentSource.Global,
            calories: 300,
            proteinG: '10.00',
            fatsG: '5.00',
            carbsG: '40.00',
        })
        .returning({ id: schema.recipes.id });

    await context.db
        .insert(schema.recipeTranslations)
        .values({ recipeId: row!.id, language: 'uk', title });

    created.recipes.push(row!.id);

    return row!.id;
}

async function favourite(context: AdminTestContext, recipeId: string, userIds: string[]): Promise<void> {
    await context.db.insert(schema.recipeFavorites).values(userIds.map(userId => ({ userId, recipeId })));
}

async function createTicket(context: AdminTestContext, status: FeedbackStatus): Promise<void> {
    const [row] = await context.db
        .insert(schema.feedback)
        .values({ type: FeedbackType.Bug, status, description: `stat ticket ${status}` })
        .returning({ id: schema.feedback.id });

    created.tickets.push(row!.id);
}

async function requestDeletion(
    context: AdminTestContext,
    userId: string,
    inDays: number,
    options: { cancelled?: boolean } = {},
): Promise<void> {
    await context.db.insert(schema.accountDeletionRequests).values({
        userId,
        scheduledFor: new Date(Date.now() + inDays * DAY),
        cancelledAt: options.cancelled ? new Date() : null,
    });
}

/** Leaves the database exactly as it was found — see `created`. */
async function cleanUp(context: AdminTestContext): Promise<void> {
    // Users first: their favourites cascade away with them, and a favourite
    // holds a recipe we are about to delete.
    await context.db.delete(schema.users).where(like(schema.users.email, sql`${`%${DOMAIN}`}`));

    if (created.tickets.length > 0) {
        await context.db.delete(schema.feedback).where(inArray(schema.feedback.id, created.tickets));
    }

    if (created.recipes.length > 0) {
        await context.db.delete(schema.recipeFavorites).where(inArray(schema.recipeFavorites.recipeId, created.recipes));
        await context.db
            .delete(schema.recipeTranslations)
            .where(inArray(schema.recipeTranslations.recipeId, created.recipes));
        await context.db.delete(schema.recipes).where(inArray(schema.recipes.id, created.recipes));
    }

    if (created.products.length > 0) {
        await context.db
            .delete(schema.productTranslations)
            .where(inArray(schema.productTranslations.productId, created.products));
        await context.db.delete(schema.products).where(inArray(schema.products.id, created.products));
    }

    created.recipes.length = 0;
    created.products.length = 0;
    created.tickets.length = 0;
}
