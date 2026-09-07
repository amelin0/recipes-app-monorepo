import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { NotificationRepository, UserEntity, UserRepository, schema } from '@dns/database';
import { NotificationType } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { FaqService } from '../src/modules/faq/faq.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'reader@example.com';
const OTHER_EMAIL = 'stranger@example.com';
const PASSWORD = 'passw0rd';

const page = { unreadOnly: false, page: 1, limit: 20 };

describe('Notifications and FAQ', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let notificationsService: NotificationsService;
    let notifications: NotificationRepository;
    let faq: FaqService;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        notificationsService = ctx.moduleRef.get(NotificationsService);
        notifications = ctx.moduleRef.get(NotificationRepository);
        faq = ctx.moduleRef.get(FaqService);
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

    const send = async (userId: string, title: string, extra: Record<string, unknown> = {}): Promise<string> => {
        const created = await notifications.create({
            userId,
            type: NotificationType.Reminder,
            title,
            body: 'Текст сповіщення',
            ...extra,
        });

        return created.id;
    };

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        user = await register(EMAIL);
    });

    describe('the inbox', () => {
        it('is empty for a new account, and the bell shows nothing', async () => {
            const { items, total } = await notificationsService.list(user.id, page);

            expect(items).toHaveLength(0);
            expect(total).toBe(0);
            expect(await notificationsService.unreadCount(user.id)).toBe(0);
        });

        it('returns the newest first, unread', async () => {
            await send(user.id, 'Перше');
            await send(user.id, 'Друге');

            const { items } = await notificationsService.list(user.id, page);

            expect(items.map(item => item.title)).toEqual(['Друге', 'Перше']);
            expect(items.every(item => item.isRead)).toBe(false);
            expect(await notificationsService.unreadCount(user.id)).toBe(2);
        });

        it('carries the whole message, so the card needs no second request', async () => {
            await send(user.id, 'Оновлення', {
                type: NotificationType.System,
                subtitle: 'Що нового',
                items: ['Швидший пошук', 'Виправлення'],
                metaLabel: 'Розмір файлу: 42.5 MB',
                actionLabel: 'Оновити',
                actionRoute: '/settings/update',
            });

            const { items } = await notificationsService.list(user.id, page);

            expect(items[0]?.subtitle).toBe('Що нового');
            expect(items[0]?.items).toEqual(['Швидший пошук', 'Виправлення']);
            expect(items[0]?.metaLabel).toBe('Розмір файлу: 42.5 MB');
            expect(items[0]?.actionRoute).toBe('/settings/update');
        });

        it('a plain notification has no list and no action rather than empty strings', async () => {
            await send(user.id, 'Нагадування');

            const { items } = await notificationsService.list(user.id, page);

            expect(items[0]?.items).toEqual([]);
            expect(items[0]?.actionLabel).toBeNull();
            expect(items[0]?.subtitle).toBeNull();
        });

        it('keeps one account’s notifications out of another’s', async () => {
            const stranger = await register(OTHER_EMAIL);
            await send(stranger.id, 'Чуже');
            await send(user.id, 'Наше');

            const { items } = await notificationsService.list(user.id, page);

            expect(items.map(item => item.title)).toEqual(['Наше']);
        });

        it('counts every match, not only the page returned', async () => {
            await send(user.id, 'Одне');
            await send(user.id, 'Друге');
            await send(user.id, 'Третє');

            const { items, total } = await notificationsService.list(user.id, { ...page, limit: 2 });

            expect(items).toHaveLength(2);
            expect(total).toBe(3);
        });
    });

    describe('reading', () => {
        it('marks one read and takes it off the bell', async () => {
            const id = await send(user.id, 'Нагадування');

            await notificationsService.markRead(user.id, id);

            const { items } = await notificationsService.list(user.id, page);
            expect(items[0]?.isRead).toBe(true);
            expect(await notificationsService.unreadCount(user.id)).toBe(0);
        });

        it('opening the same one twice is not an error', async () => {
            const id = await send(user.id, 'Нагадування');

            await notificationsService.markRead(user.id, id);
            await expect(notificationsService.markRead(user.id, id)).resolves.toBeUndefined();
        });

        it('refuses to mark somebody else’s notification', async () => {
            const stranger = await register(OTHER_EMAIL);
            const theirs = await send(stranger.id, 'Чуже');

            await expect(notificationsService.markRead(user.id, theirs)).rejects.toBeInstanceOf(NotFoundException);
            expect(await notificationsService.unreadCount(stranger.id)).toBe(1);
        });

        it('the unread tab shows only what is unread', async () => {
            const first = await send(user.id, 'Прочитане');
            await send(user.id, 'Непрочитане');
            await notificationsService.markRead(user.id, first);

            const unread = await notificationsService.list(user.id, { ...page, unreadOnly: true });

            expect(unread.items.map(item => item.title)).toEqual(['Непрочитане']);
            expect(unread.total).toBe(1);
        });

        it('clears the bell in one act', async () => {
            await send(user.id, 'Одне');
            await send(user.id, 'Друге');

            await notificationsService.markAllRead(user.id);

            expect(await notificationsService.unreadCount(user.id)).toBe(0);
            // Read notifications stay in the list — only the badge goes.
            expect((await notificationsService.list(user.id, page)).total).toBe(2);
        });
    });

    describe('the FAQ', () => {
        it('returns the editorial content that shipped with the schema', async () => {
            const topics = await faq.topics(user.id);

            expect(topics).toHaveLength(7);
            expect(topics[0]?.slug).toBe('norms');
            expect(topics[0]?.title).toBe('НОРМИ Й РОЗРАХУНКИ');
            expect(topics[0]?.questions.length).toBeGreaterThan(0);
            expect(topics[0]?.questions[0]?.question).toBe('Як формується моя денна норма калорій?');
        });

        it('keeps topics and questions in editorial order', async () => {
            const topics = await faq.topics(user.id);

            expect(topics.map(topic => topic.slug)).toEqual([
                'norms',
                'usage',
                'diet',
                'results',
                'health',
                'account',
                'technical',
            ]);
        });

        it('falls back to Ukrainian for a reader whose language has no copy', async () => {
            await ctx.db
                .update(schema.userSettings)
                .set({ language: 'pl' })
                .where(eq(schema.userSettings.userId, user.id));

            const topics = await faq.topics(user.id);

            expect(topics).toHaveLength(7);
            expect(topics[0]?.title).toBe('НОРМИ Й РОЗРАХУНКИ');
        });
    });
});
