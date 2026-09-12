import { BadRequestException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { StorageErrorCode, StorageService } from '@dns/api-infrastructure/storage';
import { UserEntity, UserRepository } from '@dns/database';
import { FeedbackType, StorageScope } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { FeedbackService } from '../src/modules/user/feedback.service';

import { truncateAuthTables } from './support/db';
import { grantOnly, upload } from './support/storage';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'reporter@example.com';
const PASSWORD = 'passw0rd';

describe('Support tickets', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let feedbackService: FeedbackService;
    let storage: StorageService;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        feedbackService = ctx.moduleRef.get(FeedbackService);
        storage = ctx.moduleRef.get(StorageService);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: '000000' });

        const found = await users.findByEmail(EMAIL);
        expect(found).not.toBeNull();
        user = found as UserEntity;
    });

    it('stores a ticket with its attachments and free-form context', async () => {
        const created = await feedbackService.create(user.id, {
            type: FeedbackType.Bug,
            description: 'The recipe list is empty right after signing in.',
            imageUrls: [await upload(storage, user.id, StorageScope.Feedback)],
            context: { appVersion: '1.0.0', platform: 'ios', build: 1 },
        });

        expect(created.type).toBe(FeedbackType.Bug);
        expect(created.imageUrls).toHaveLength(1);
    });

    it('refuses an attachment whose upload never happened, and stores nothing', async () => {
        // One real attachment and one bare grant: the ticket must not go
        // through with the good half, or staff get a thread with a hole in it.
        const imageUrls = [
            await upload(storage, user.id, StorageScope.Feedback),
            await grantOnly(storage, user.id, StorageScope.Feedback),
        ];

        await expect(
            feedbackService.create(user.id, {
                type: FeedbackType.Bug,
                description: 'The second screenshot failed to upload.',
                imageUrls,
            }),
        ).rejects.toMatchObject({ response: { code: StorageErrorCode.NotUploaded } });

        expect(await ctx.db.query.feedback.findMany()).toHaveLength(0);
    });

    it('refuses an attachment the user uploaded for something else', async () => {
        const avatarUrl = await upload(storage, user.id, StorageScope.ProfilePhoto);

        await expect(
            feedbackService.create(user.id, {
                type: FeedbackType.Other,
                description: 'Trying to attach my avatar upload to a ticket.',
                imageUrls: [avatarUrl],
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses an attachment hosted anywhere but our storage', async () => {
        await expect(
            feedbackService.create(user.id, {
                type: FeedbackType.Other,
                description: 'Pointing support staff at an arbitrary address.',
                imageUrls: ['https://evil.example.com/tracker.jpg'],
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('outlives its author, and the cascade alone leaves the reply address behind', async () => {
        await feedbackService.create(user.id, {
            type: FeedbackType.Bug,
            description: 'Please reply to my other address about this.',
            replyEmail: 'personal@example.com',
        });

        await ctx.db.execute(sql`DELETE FROM users WHERE id = ${user.id}`);

        const rows = await ctx.db.query.feedback.findMany();
        expect(rows).toHaveLength(1);
        // ADR-0005: the thread survives, anonymised — a crash report stays
        // useful after its reporter leaves.
        expect(rows[0]?.userId).toBeNull();
        // ...but ON DELETE SET NULL only reaches the foreign key. The personal
        // address is still there, which is why the deletion runbook clears it
        // with an explicit UPDATE before removing the account.
        expect(rows[0]?.replyEmail).toBe('personal@example.com');
    });
});
