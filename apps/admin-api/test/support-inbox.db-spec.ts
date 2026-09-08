import { NotFoundException } from '@nestjs/common';
import { eq, like, sql } from 'drizzle-orm';

import { schema } from '@dns/database';
import { AdminRole, FeedbackStatus, FeedbackType } from '@dns/shared-types';

import { FeedbackDetailView } from '../src/modules/support/dto';
import { SupportService } from '../src/modules/support/support.service';

import { AdminTestContext, createAdminTestContext } from './support/testing-module';

/** Accounts this suite makes; cleanup deletes by the domain, nothing else. */
const DOMAIN = '@support-inbox.test';

describe('admin support inbox', () => {
    let context: AdminTestContext;
    let support: SupportService;
    let staff: { id: string; fullName: string };

    beforeAll(async () => {
        context = await createAdminTestContext();
        support = context.moduleRef.get(SupportService);
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
        staff = await createAdmin(context, 'Олег Ч.');
    });

    describe('the queue', () => {
        it('shows the newest ticket first', async () => {
            await createTicket(context, { description: 'Найстаріше', createdAt: daysAgo(2) });
            await createTicket(context, { description: 'Найновіше', createdAt: daysAgo(0) });

            const page = await support.list(query());

            expect(page.items[0]?.description).toBe('Найновіше');
        });

        it('narrows by state and by type', async () => {
            await createTicket(context, { description: 'Баг', type: FeedbackType.Bug });
            await createTicket(context, {
                description: 'Ідея',
                type: FeedbackType.Improvement,
                status: FeedbackStatus.Resolved,
            });

            expect(descriptionsOf(await support.list(query({ status: FeedbackStatus.New })))).toEqual(['Баг']);
            expect(descriptionsOf(await support.list(query({ type: FeedbackType.Improvement })))).toEqual(['Ідея']);
        });

        it('searches the text and the reply address', async () => {
            await createTicket(context, { description: 'Не приходить код підтвердження' });
            await createTicket(context, { description: 'Інше', replyEmail: `person${DOMAIN}` });

            expect(descriptionsOf(await support.list(query({ search: 'код підтвердження' })))).toEqual([
                'Не приходить код підтвердження',
            ]);
            expect(descriptionsOf(await support.list(query({ search: 'person@support-inbox' })))).toEqual(['Інше']);
        });

        /**
         * The queue counter is a filter, not a second endpoint (FR-007). If a
         * moved ticket still counted, the number would never fall and would
         * stop meaning anything.
         */
        it('stops counting a ticket once it is moved', async () => {
            const id = await createTicket(context, { description: 'До роботи' });

            expect((await support.list(query({ status: FeedbackStatus.New }))).total).toBe(1);

            await support.setStatus(id, FeedbackStatus.InProgress);

            expect((await support.list(query({ status: FeedbackStatus.New }))).total).toBe(0);
        });

        it('can reject a ticket without calling it solved', async () => {
            const id = await createTicket(context, { description: 'Спам' });

            await support.setStatus(id, FeedbackStatus.Rejected);

            const ticket = await support.findById(id);
            expect(ticket.status).toBe(FeedbackStatus.Rejected);
            expect((await support.list(query({ status: FeedbackStatus.Resolved }))).total).toBe(0);
        });

        it('lets a wrongly moved ticket go back', async () => {
            const id = await createTicket(context, { description: 'Помилковий клік' });

            await support.setStatus(id, FeedbackStatus.Resolved);
            await support.setStatus(id, FeedbackStatus.New);

            expect((await support.findById(id)).status).toBe(FeedbackStatus.New);
        });

        it('refuses an unknown id', async () => {
            await expect(support.setStatus(crypto.randomUUID(), FeedbackStatus.Resolved)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('the card', () => {
        it('carries the author and whether their account is stopped', async () => {
            const userId = await createUser(context, `author${DOMAIN}`);
            await context.db.update(schema.users).set({ blockedAt: new Date() }).where(eq(schema.users.id, userId));
            const id = await createTicket(context, { description: 'Від заблокованого', userId });

            const ticket = await support.findById(id);

            expect(ticket.author).toMatchObject({ id: userId, email: `author${DOMAIN}`, isBlocked: true });
        });

        /**
         * ADR-0005 anonymises support threads instead of deleting them, so the
         * ticket has to survive its author — the whole reason `user_id` is
         * nullable.
         */
        it('survives the author deleting their account', async () => {
            const userId = await createUser(context, `leaving${DOMAIN}`);
            const id = await createTicket(context, { description: 'Падає на 1.2', userId });

            await context.db.delete(schema.users).where(eq(schema.users.id, userId));

            const ticket = await support.findById(id);
            expect(ticket.description).toBe('Падає на 1.2');
            expect(ticket.author).toBeNull();
        });

        it('carries the attachments and the context the app sent', async () => {
            const id = await createTicket(context, {
                description: 'Зі скриншотами',
                imageUrls: ['https://example.test/a.png', 'https://example.test/b.png'],
                context: { appVersion: '1.2.0', platform: 'ios' },
            });

            const view = FeedbackDetailView.fromDetail(await support.findById(id));

            expect(view.imageCount).toBe(2);
            expect(view.imageUrls).toHaveLength(2);
            expect(view.context).toMatchObject({ appVersion: '1.2.0' });
        });

        it('refuses an unknown id', async () => {
            await expect(support.findById(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('internal notes', () => {
        it('records who wrote it and when', async () => {
            const id = await createTicket(context, { description: 'Розбираємось' });

            await support.addNote(id, staff, 'Відтворюється на 1.2, Android');

            const [note] = (await support.findById(id)).notes;
            expect(note).toMatchObject({ authorName: 'Олег Ч.', body: 'Відтворюється на 1.2, Android' });
            expect(note?.createdAt).toBeInstanceOf(Date);
        });

        it('keeps them in the order they were written', async () => {
            const id = await createTicket(context, { description: 'Два кроки' });

            await support.addNote(id, staff, 'Перша');
            await support.addNote(id, staff, 'Друга');

            expect((await support.findById(id)).notes.map(note => note.body)).toEqual(['Перша', 'Друга']);
        });

        /**
         * FR-010. The staff account is nulled out; the name is a snapshot, and
         * without it the journal would turn anonymous exactly when it matters.
         */
        it('survives the author of the note leaving', async () => {
            const id = await createTicket(context, { description: 'Хтось колись' });
            await support.addNote(id, staff, 'Перевірив логи');

            await context.db.delete(schema.admins).where(eq(schema.admins.id, staff.id));

            const [note] = (await support.findById(id)).notes;
            expect(note?.authorName).toBe('Олег Ч.');
            expect(note?.body).toBe('Перевірив логи');
        });

        it('is not searchable — a private note must not surface somebody else’s ticket', async () => {
            const id = await createTicket(context, { description: 'Звичайне звернення' });
            await support.addNote(id, staff, 'Унікальнеслово');

            expect((await support.list(query({ search: 'Унікальнеслово' }))).total).toBe(0);
        });

        it('refuses a note on an unknown ticket', async () => {
            await expect(support.addNote(crypto.randomUUID(), staff, 'Нікуди')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('goes away with its ticket', async () => {
            const id = await createTicket(context, { description: 'Тимчасове' });
            await support.addNote(id, staff, 'Слід');

            await context.db.delete(schema.feedback).where(eq(schema.feedback.id, id));

            const notes = await context.db
                .select()
                .from(schema.feedbackNotes)
                .where(eq(schema.feedbackNotes.feedbackId, id));
            expect(notes).toHaveLength(0);
        });
    });
});

type ListQuery = Parameters<SupportService['list']>[0];

function query(overrides: Partial<ListQuery> = {}): ListQuery {
    return { page: 1, limit: 100, ...overrides } as ListQuery;
}

const descriptionsOf = (page: { items: { description: string }[] }): string[] =>
    page.items.map(item => item.description);

const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function createTicket(
    context: AdminTestContext,
    options: {
        description: string;
        type?: FeedbackType;
        status?: FeedbackStatus;
        userId?: string;
        replyEmail?: string;
        imageUrls?: string[];
        context?: unknown;
        createdAt?: Date;
    },
): Promise<string> {
    const [row] = await context.db
        .insert(schema.feedback)
        .values({
            userId: options.userId ?? null,
            type: options.type ?? FeedbackType.Bug,
            status: options.status ?? FeedbackStatus.New,
            description: options.description,
            imageUrls: options.imageUrls ?? [],
            replyEmail: options.replyEmail ?? null,
            context: options.context ?? null,
            ...(options.createdAt ? { createdAt: options.createdAt } : {}),
        })
        .returning({ id: schema.feedback.id });

    return row!.id;
}

async function createUser(context: AdminTestContext, email: string): Promise<string> {
    const [row] = await context.db
        .insert(schema.users)
        .values({ email, passwordHash: 'not-a-real-hash', emailVerifiedAt: new Date() })
        .returning({ id: schema.users.id });

    return row!.id;
}

async function createAdmin(context: AdminTestContext, fullName: string): Promise<{ id: string; fullName: string }> {
    const [row] = await context.db
        .insert(schema.admins)
        .values({
            email: `staff-${crypto.randomUUID()}${DOMAIN}`,
            passwordHash: 'not-a-real-hash',
            fullName,
            role: AdminRole.Admin,
        })
        .returning({ id: schema.admins.id });

    return { id: row!.id, fullName };
}

/**
 * Tickets are all ours — the client suite creates none — but users and admins
 * are shared, so those go by our own domain and nothing else.
 */
async function cleanUp(context: AdminTestContext): Promise<void> {
    await context.db.delete(schema.feedback);
    await context.db.delete(schema.admins).where(like(schema.admins.email, sql`${`%${DOMAIN}`}`));
    await context.db.delete(schema.users).where(like(schema.users.email, sql`${`%${DOMAIN}`}`));
}
