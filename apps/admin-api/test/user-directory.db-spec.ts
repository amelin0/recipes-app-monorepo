import { NotFoundException } from '@nestjs/common';
import { eq, like, sql } from 'drizzle-orm';

import { AdminUserListItem, schema } from '@dns/database';
import {
    ContentSource,
    Gender,
    OAuthProvider,
    PurchaseStore,
    SubscriptionSource,
    SubscriptionStatus,
    Theme,
} from '@dns/shared-types';

import { AdminUserDetailView } from '../src/modules/user/dto';
import { AdminUserService } from '../src/modules/user/user.service';

import { AdminTestContext, createAdminTestContext } from './support/testing-module';

/**
 * Every account this suite makes carries this domain, and cleanup deletes by
 * it. The client suite shares this database and its users are not ours to
 * remove.
 */
const DOMAIN = '@user-directory.test';

const DAY = 24 * 60 * 60 * 1000;

describe('admin user directory', () => {
    let context: AdminTestContext;
    let users: AdminUserService;

    beforeAll(async () => {
        context = await createAdminTestContext();
        users = context.moduleRef.get(AdminUserService);
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

    describe('the directory', () => {
        it('lists an account with the state support is asked about', async () => {
            const id = await createUser(context, { email: `listed${DOMAIN}`, name: 'Олег' });

            const row = await findRow(users, `listed${DOMAIN}`);

            expect(row).toMatchObject({
                id,
                email: `listed${DOMAIN}`,
                name: 'Олег',
                blockedAt: null,
                hasActiveSubscription: false,
                deletionScheduledFor: null,
            });
            expect(row?.emailVerifiedAt).not.toBeNull();
        });

        it('finds an account by part of the address', async () => {
            await createUser(context, { email: `find-me-here${DOMAIN}` });

            const page = await users.list(query({ search: 'me-here' }));

            expect(page.items.map(item => item.email)).toContain(`find-me-here${DOMAIN}`);
        });

        it('finds an account by the profile name', async () => {
            await createUser(context, { email: `named${DOMAIN}`, name: 'Ярослава' });

            const page = await users.list(query({ search: 'Ярослав' }));

            expect(page.items.map(item => item.email)).toContain(`named${DOMAIN}`);
        });

        /**
         * The questionnaire can be skipped entirely, so there is no `profiles`
         * row — and an inner join would silently drop exactly the accounts
         * support hears from most (spec, Edge Cases).
         */
        it('keeps an account that never started the questionnaire', async () => {
            await createUser(context, { email: `bare${DOMAIN}`, withProfile: false });

            const row = await findRow(users, `bare${DOMAIN}`);

            expect(row).toBeDefined();
            expect(row?.name).toBeNull();
            expect(row?.language).toBeNull();
        });
    });

    describe('filters', () => {
        it('narrows to blocked accounts', async () => {
            const blocked = await createUser(context, { email: `blocked${DOMAIN}` });
            await createUser(context, { email: `free${DOMAIN}` });
            await users.setBlocked(blocked, true);

            const page = await users.list(query({ isBlocked: true }));

            expect(emailsOf(page.items)).toEqual([`blocked${DOMAIN}`]);
        });

        it('narrows to accounts whose address is unconfirmed', async () => {
            await createUser(context, { email: `unverified${DOMAIN}`, verified: false });
            await createUser(context, { email: `verified${DOMAIN}` });

            const page = await users.list(query({ isEmailVerified: false }));

            expect(emailsOf(page.items)).toEqual([`unverified${DOMAIN}`]);
        });

        it('narrows to paying accounts', async () => {
            const paying = await createUser(context, { email: `paying${DOMAIN}` });
            await createUser(context, { email: `free-tier${DOMAIN}` });
            await giveSubscription(context, paying);

            const page = await users.list(query({ hasSubscription: true }));

            expect(emailsOf(page.items)).toEqual([`paying${DOMAIN}`]);
        });
    });

    describe('deletion requests', () => {
        it('finds accounts with a pending request', async () => {
            const leaving = await createUser(context, { email: `leaving${DOMAIN}` });
            await createUser(context, { email: `staying${DOMAIN}` });
            await requestDeletion(context, leaving, { inDays: 30 });

            expect(emailsOf((await users.list(query({ deletion: 'active' }))).items)).toEqual([`leaving${DOMAIN}`]);
            expect(emailsOf((await users.list(query({ deletion: 'none' }))).items)).toEqual([`staying${DOMAIN}`]);

            // The row carries the date, not just membership of the filter —
            // that is what puts the badge on the list without opening a card.
            const row = await findRow(users, `leaving${DOMAIN}`);
            expect(row?.deletionScheduledFor).toBeInstanceOf(Date);
        });

        it('counts only the requests whose date has passed as overdue', async () => {
            const waiting = await createUser(context, { email: `waiting${DOMAIN}` });
            const overdue = await createUser(context, { email: `overdue${DOMAIN}` });
            await requestDeletion(context, waiting, { inDays: 30 });
            await requestDeletion(context, overdue, { inDays: -1 });

            expect(emailsOf((await users.list(query({ deletion: 'overdue' }))).items)).toEqual([`overdue${DOMAIN}`]);
        });

        /**
         * The number the panel shows is meant to be worked off. If a cancelled
         * request still counted, it would never go down — and the one signal
         * that these are piling up would stop meaning anything.
         */
        it('stops counting a request once it is cancelled', async () => {
            const id = await createUser(context, { email: `cancelled${DOMAIN}` });
            await requestDeletion(context, id, { inDays: -1 });

            expect((await users.list(query({ deletion: 'overdue' }))).total).toBe(1);

            await users.cancelDeletionRequest(id);

            expect((await users.list(query({ deletion: 'overdue' }))).total).toBe(0);
        });

        it('keeps the account and the request row when a request is cancelled', async () => {
            const id = await createUser(context, { email: `undo${DOMAIN}` });
            await requestDeletion(context, id, { inDays: 30 });

            await users.cancelDeletionRequest(id);

            const detail = await users.findById(id);
            expect(detail.deletionRequest).toBeNull();

            const rows = await context.db
                .select()
                .from(schema.accountDeletionRequests)
                .where(eq(schema.accountDeletionRequests.userId, id));
            expect(rows).toHaveLength(1);
            expect(rows[0]?.cancelledAt).not.toBeNull();
        });

        it('refuses to cancel when there is nothing pending', async () => {
            const id = await createUser(context, { email: `nothing-pending${DOMAIN}` });

            await expect(users.cancelDeletionRequest(id)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('the card', () => {
        it('names every way into the account', async () => {
            const id = await createUser(context, { email: `methods${DOMAIN}` });
            await context.db.insert(schema.oauthIdentities).values({
                userId: id,
                provider: OAuthProvider.Apple,
                providerUserId: `apple-${id}`,
            });

            const detail = await users.findById(id);

            expect(detail.signInMethods.sort()).toEqual(['apple', 'password']);
        });

        it('counts own dishes, favourites and the last session', async () => {
            const id = await createUser(context, { email: `active${DOMAIN}` });
            const own = await createOwnRecipe(context, id);
            await context.db.insert(schema.recipeFavorites).values({ userId: id, recipeId: own });
            await context.db.insert(schema.refreshTokens).values({
                userId: id,
                familyId: crypto.randomUUID(),
                tokenHash: 'x',
                expiresAt: new Date(Date.now() + DAY),
            });

            const detail = await users.findById(id);

            expect(detail.activity.ownRecipes).toBe(1);
            expect(detail.activity.favorites).toBe(1);
            expect(detail.activity.lastSeenAt).not.toBeNull();
        });

        it('marks a request whose date has passed as overdue', async () => {
            const id = await createUser(context, { email: `late${DOMAIN}` });
            await requestDeletion(context, id, { inDays: -2 });

            const view = AdminUserDetailView.fromDetail(await users.findById(id));

            expect(view.deletionRequest?.isOverdue).toBe(true);
        });

        /**
         * FR-004 is about what the panel is *not* allowed to show. Asserted on
         * the view rather than the repository, because the view is the part
         * that reaches a browser.
         */
        it('carries nothing from the body questionnaire', async () => {
            const id = await createUser(context, { email: `private${DOMAIN}` });
            await context.db
                .update(schema.profiles)
                .set({ gender: Gender.Female, weightKg: '61.5', heightCm: '170.0' })
                .where(eq(schema.profiles.userId, id));

            // Proof the row really holds what the view must not show. Without
            // this the test would pass just as happily against a profile that
            // was never written — asserting nothing at all.
            const [profile] = await context.db
                .select({ weightKg: schema.profiles.weightKg })
                .from(schema.profiles)
                .where(eq(schema.profiles.userId, id));
            expect(profile?.weightKg).toBe('61.5');

            const view = AdminUserDetailView.fromDetail(await users.findById(id));
            const serialised = JSON.stringify(view);

            for (const forbidden of ['gender', 'weightKg', 'heightCm', 'birthDate', 'goal', 'targetWeight']) {
                expect(serialised).not.toContain(forbidden);
            }
            expect(serialised).not.toContain('61.5');
        });

        it('refuses an unknown id', async () => {
            await expect(users.findById(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('blocking', () => {
        it('records the moment and revokes every session', async () => {
            const id = await createUser(context, { email: `to-block${DOMAIN}` });
            await context.db.insert(schema.refreshTokens).values([
                { userId: id, familyId: crypto.randomUUID(), tokenHash: 'a', expiresAt: new Date(Date.now() + DAY) },
                { userId: id, familyId: crypto.randomUUID(), tokenHash: 'b', expiresAt: new Date(Date.now() + DAY) },
            ]);

            await users.setBlocked(id, true);

            const detail = await users.findById(id);
            expect(detail.blockedAt).not.toBeNull();

            const sessions = await context.db
                .select()
                .from(schema.refreshTokens)
                .where(eq(schema.refreshTokens.userId, id));
            expect(sessions).toHaveLength(0);
        });

        it('does not hand the sessions back when the block is lifted', async () => {
            const id = await createUser(context, { email: `to-unblock${DOMAIN}` });
            await context.db.insert(schema.refreshTokens).values({
                userId: id,
                familyId: crypto.randomUUID(),
                tokenHash: 'a',
                expiresAt: new Date(Date.now() + DAY),
            });

            await users.setBlocked(id, true);
            await users.setBlocked(id, false);

            expect((await users.findById(id)).blockedAt).toBeNull();

            const sessions = await context.db
                .select()
                .from(schema.refreshTokens)
                .where(eq(schema.refreshTokens.userId, id));
            expect(sessions).toHaveLength(0);
        });

        /** Two different intentions — ours and the user's. Neither cancels the other. */
        it('leaves a pending deletion request alone', async () => {
            const id = await createUser(context, { email: `both${DOMAIN}` });
            await requestDeletion(context, id, { inDays: 30 });

            await users.setBlocked(id, true);

            const detail = await users.findById(id);
            expect(detail.blockedAt).not.toBeNull();
            expect(detail.deletionRequest).not.toBeNull();
        });

        it('refuses an unknown id', async () => {
            await expect(users.setBlocked(crypto.randomUUID(), true)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});

type ListQuery = Parameters<AdminUserService['list']>[0];

function query(overrides: Partial<ListQuery> = {}): ListQuery {
    return { page: 1, limit: 100, ...overrides } as ListQuery;
}

const emailsOf = (items: AdminUserListItem[]): string[] =>
    items.filter(item => item.email.endsWith(DOMAIN)).map(item => item.email);

/** One row of the directory, found by address rather than by page position. */
async function findRow(service: AdminUserService, email: string): Promise<AdminUserListItem | undefined> {
    const page = await service.list(query({ search: email }));
    return page.items.find(item => item.email === email);
}

async function createUser(
    context: AdminTestContext,
    options: { email: string; name?: string; verified?: boolean; withProfile?: boolean },
): Promise<string> {
    const [user] = await context.db
        .insert(schema.users)
        .values({
            email: options.email,
            passwordHash: 'not-a-real-hash',
            emailVerifiedAt: options.verified === false ? null : new Date(),
        })
        .returning({ id: schema.users.id });

    const id = user!.id;

    if (options.withProfile !== false) {
        await context.db.insert(schema.profiles).values({ userId: id, name: options.name ?? null });
        await context.db.insert(schema.userSettings).values({
            userId: id,
            language: 'uk',
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

async function requestDeletion(
    context: AdminTestContext,
    userId: string,
    options: { inDays: number },
): Promise<void> {
    await context.db.insert(schema.accountDeletionRequests).values({
        userId,
        scheduledFor: new Date(Date.now() + options.inDays * DAY),
    });
}

async function createOwnRecipe(context: AdminTestContext, userId: string): Promise<string> {
    const [recipe] = await context.db
        .insert(schema.recipes)
        .values({
            source: ContentSource.Custom,
            createdBy: userId,
            calories: 300,
            proteinG: '10.00',
            fatsG: '5.00',
            carbsG: '40.00',
        })
        .returning({ id: schema.recipes.id });

    return recipe!.id;
}

/**
 * Deletes only what this suite made.
 *
 * `DELETE FROM users` would be simpler and would take the client suite's
 * fixtures with it — the two share one database, and a suite that tidies up
 * somebody else's rows is how a green run turns into a red one somewhere else.
 */
async function removeTestUsers(context: AdminTestContext): Promise<void> {
    await context.db.delete(schema.users).where(like(schema.users.email, sql`${`%${DOMAIN}`}`));
}
