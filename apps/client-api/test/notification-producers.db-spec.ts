import { eq } from 'drizzle-orm';

import { NotificationEntity, NotificationRepository, UserRepository, schema } from '@dns/database';
import { NotificationEvent, NotificationType } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { SubscriptionService } from '../src/modules/subscription/subscription.service';
import { AccountDeletionService } from '../src/modules/user/account-deletion.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'producer@example.com';
const REFERRER_EMAIL = 'referrer@example.com';
const PASSWORD = 'passw0rd';

/**
 * The inbox had no producer at all: `GET /notifications` worked and nothing
 * ever wrote a row, so in production it was empty for good. These are the
 * events that fill it.
 */
describe('Notification producers', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let deletionService: AccountDeletionService;
    let subscriptionService: SubscriptionService;
    let notifications: NotificationRepository;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        deletionService = ctx.moduleRef.get(AccountDeletionService);
        subscriptionService = ctx.moduleRef.get(SubscriptionService);
        notifications = ctx.moduleRef.get(NotificationRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
    });

    const register = async (email: string): Promise<string> => {
        await authService.register({ email, password: PASSWORD });
        await authService.verifyEmail({ email, code: '000000' });

        const user = await users.findByEmail(email);
        return user!.id;
    };

    const inboxOf = async (userId: string): Promise<NotificationEntity[]> => {
        const page = await notifications.findPage({ userId, unreadOnly: false, page: 1, limit: 50 });
        return page.items;
    };

    describe('account deletion', () => {
        it('writes the date the account disappears, and the way back', async () => {
            const userId = await register(EMAIL);

            await deletionService.request(userId);

            const [message] = await inboxOf(userId);
            expect(message?.type).toBe(NotificationType.System);
            expect(message?.actionRoute).toBe('/profile/deletion-request');
            // The grace period is thirty days; the text has to name the day,
            // because «after the grace period» is not something to plan around.
            expect(message?.body).toMatch(/\d/);
        });

        it('says so when the request is taken back', async () => {
            const userId = await register(EMAIL);

            await deletionService.request(userId);
            await deletionService.cancel(userId);

            const bodies = (await inboxOf(userId)).map(message => message.title);
            expect(bodies).toHaveLength(2);
        });

        /**
         * A notification is a side effect. If writing one could fail the
         * operation, a deletion request would be refused because of a message
         * about it — so the producer swallows its own errors, and this proves
         * the request survives.
         */
        it('still records the request when the inbox write fails', async () => {
            const userId = await register(EMAIL);
            const producer = ctx.moduleRef.get(NotificationRepository);
            const create = jest.spyOn(producer, 'create').mockRejectedValue(new Error('inbox is down'));

            await expect(deletionService.request(userId)).resolves.toBeDefined();
            expect(await deletionService.findActive(userId)).not.toBeNull();
            expect(await inboxOf(userId)).toHaveLength(0);

            create.mockRestore();
        });
    });

    describe('the reader’s language', () => {
        it('writes in the language the account reads in at that moment', async () => {
            const userId = await register(EMAIL);
            await ctx.db
                .update(schema.userSettings)
                .set({ language: 'en' })
                .where(eq(schema.userSettings.userId, userId));

            await deletionService.request(userId);

            const [message] = await inboxOf(userId);
            expect(message?.title).toBe('Account scheduled for deletion');
        });

        it('falls back to Ukrainian rather than writing nothing', async () => {
            const userId = await register(EMAIL);
            await ctx.db
                .update(schema.userSettings)
                .set({ language: 'pl' })
                .where(eq(schema.userSettings.userId, userId));

            await deletionService.request(userId);

            const [message] = await inboxOf(userId);
            expect(message?.title).toBe('Акаунт заплановано до видалення');
        });
    });

    describe('referral', () => {
        /**
         * The referrer is the one who otherwise never finds out: their screen
         * shows a counter that moves with nothing to explain it.
         */
        it('tells the referrer their code was used, and the redeemer their premium is on', async () => {
            const referrerId = await register(REFERRER_EMAIL);
            const redeemerId = await register(EMAIL);

            const { code } = await subscriptionService.referral(referrerId);
            await subscriptionService.redeemCode(redeemerId, code);

            const referrerInbox = await inboxOf(referrerId);
            expect(referrerInbox).toHaveLength(1);
            expect(referrerInbox[0]?.title).toBe('Вашим кодом скористалися');

            const redeemerInbox = await inboxOf(redeemerId);
            expect(redeemerInbox.map(message => message.type)).toContain(NotificationType.Subscription);
        });

        it('does not promise the referrer a month nobody grants', async () => {
            const referrerId = await register(REFERRER_EMAIL);
            const redeemerId = await register(EMAIL);

            const { code } = await subscriptionService.referral(referrerId);
            await subscriptionService.redeemCode(redeemerId, code);

            const [message] = await inboxOf(referrerId);
            // Nothing in the product gives the referrer their free month yet
            // (a known debt). A message that said otherwise would be the only
            // part of the app claiming it happened.
            expect(`${message?.title} ${message?.body}`).not.toMatch(/місяц|month/i);
        });
    });

    describe('what is written down', () => {
        it('records which event produced the message', async () => {
            const userId = await register(EMAIL);

            await deletionService.request(userId);

            const [row] = await ctx.db
                .select({ event: schema.notifications.event })
                .from(schema.notifications)
                .where(eq(schema.notifications.userId, userId));

            expect(row?.event).toBe(NotificationEvent.AccountDeletionRequested);
        });
    });
});
