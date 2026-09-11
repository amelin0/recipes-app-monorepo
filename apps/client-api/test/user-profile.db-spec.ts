import { ConflictException, NotFoundException } from '@nestjs/common';

import { StorageErrorCode, StorageService } from '@dns/api-infrastructure/storage';
import { MEAL_REMINDER_DEFAULTS, USER_SETTINGS_DEFAULTS, WEIGH_IN_PERIODICITY_DAYS_DEFAULT } from '@dns/constants';
import { ProfileRepository, UserEntity, UserRepository } from '@dns/database';
import { OAuthProvider, ReminderType, StorageScope, Theme } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { OAuthSignInService } from '../src/modules/auth/oauth.service';
import { AccountDeletionService } from '../src/modules/user/account-deletion.service';
import { ProfileService } from '../src/modules/user/profile.service';
import { RemindersService } from '../src/modules/user/reminders.service';

import { truncateAuthTables } from './support/db';
import { grantOnly, isStored, upload } from './support/storage';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'profile@example.com';
const PASSWORD = 'passw0rd';
const DAY_MS = 86_400_000;

describe('User domain', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let oauthSignIn: OAuthSignInService;
    let profileService: ProfileService;
    let remindersService: RemindersService;
    let deletionService: AccountDeletionService;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        oauthSignIn = ctx.moduleRef.get(OAuthSignInService);
        profileService = ctx.moduleRef.get(ProfileService);
        remindersService = ctx.moduleRef.get(RemindersService);
        deletionService = ctx.moduleRef.get(AccountDeletionService);
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

    describe('provisioning', () => {
        it('gives a new account its profile, settings and five reminders', async () => {
            const { profile, settings } = await profileService.getAggregate(user);

            expect(profile.name).toBeNull();
            expect(settings.theme).toBe(USER_SETTINGS_DEFAULTS.theme);
            expect(settings.language).toBe(USER_SETTINGS_DEFAULTS.language);

            const reminders = await remindersService.list(user.id);
            expect(reminders).toHaveLength(MEAL_REMINDER_DEFAULTS.length + 1);
            expect(reminders.every(reminder => reminder.enabled)).toBe(true);
        });

        it('gives the weigh-in a cadence and the meals a time, never both', async () => {
            const reminders = await remindersService.list(user.id);

            const weighIn = reminders.find(reminder => reminder.isWeighIn());
            expect(weighIn?.periodicityDays).toBe(WEIGH_IN_PERIODICITY_DAYS_DEFAULT);
            expect(weighIn?.timeOfDay).toBeNull();
            expect(weighIn?.nextFireAt).not.toBeNull();

            for (const meal of reminders.filter(reminder => !reminder.isWeighIn())) {
                expect(meal.timeOfDay).not.toBeNull();
                expect(meal.periodicityDays).toBeNull();
            }
        });

        it('provisions an account created through a provider the same way', async () => {
            await truncateAuthTables(ctx.db);

            ctx.oauth.willReturn(OAuthProvider.Google, 'provider-1', 'viagoogle@example.com');
            await oauthSignIn.signIn({ provider: OAuthProvider.Google, idToken: 'stub' });

            const created = await users.findByEmail('viagoogle@example.com');
            expect(created).not.toBeNull();

            const { settings } = await profileService.getAggregate(created as UserEntity);
            expect(settings.theme).toBe(USER_SETTINGS_DEFAULTS.theme);
            expect(await remindersService.list((created as UserEntity).id)).toHaveLength(
                MEAL_REMINDER_DEFAULTS.length + 1,
            );
        });
    });

    describe('profile and settings', () => {
        // Trimming is the schema's job and is covered in @dns/validation; the
        // service takes an already-normalised value, so passing a padded one
        // here would test a shape that cannot reach it through a route.
        it('derives up to two initials from the name', async () => {
            const profile = await profileService.updateProfile(user, { name: 'Олег Петрович Чередник' });

            expect(profile.name).toBe('Олег Петрович Чередник');
            expect(profile.initials()).toBe('ОП');
        });

        it('derives a single initial from a one-word name', async () => {
            const profile = await profileService.updateProfile(user, { name: 'Олег' });
            expect(profile.initials()).toBe('О');
        });

        it('has no initials while the name is unset', async () => {
            const { profile } = await profileService.getAggregate(user);
            expect(profile.initials()).toBe('');
        });

        it('changes one setting and leaves the rest alone', async () => {
            const before = (await profileService.getAggregate(user)).settings;

            const after = await profileService.updateSettings(user, { theme: Theme.Dark });

            expect(after.theme).toBe(Theme.Dark);
            expect(after.language).toBe(before.language);
            expect(after.massUnit).toBe(before.massUnit);
            expect(after.waterUnit).toBe(before.waterUnit);
        });
    });

    // These PUT real bytes, so MinIO from docker compose must be up as well.
    describe('profile photo', () => {
        let storage: StorageService;

        beforeAll(() => {
            storage = ctx.moduleRef.get(StorageService);
        });

        it('stores a photo that was actually uploaded', async () => {
            const photoUrl = await upload(storage, user.id, StorageScope.ProfilePhoto);

            const profile = await profileService.updateProfile(user, { photoUrl });

            expect(profile.photoUrl).toBe(photoUrl);
        });

        it('refuses a photo URL nothing was uploaded to, and leaves the row alone', async () => {
            const photoUrl = await grantOnly(storage, user.id, StorageScope.ProfilePhoto);

            await expect(profileService.updateProfile(user, { name: 'Олег', photoUrl })).rejects.toMatchObject({
                response: { code: StorageErrorCode.NotUploaded },
            });

            const { profile } = await profileService.getAggregate(user);
            expect(profile.photoUrl).toBeNull();
            expect(profile.name).toBeNull();
        });

        it('deletes the replaced photo once the row points at the new one', async () => {
            const first = await upload(storage, user.id, StorageScope.ProfilePhoto);
            const second = await upload(storage, user.id, StorageScope.ProfilePhoto);

            await profileService.updateProfile(user, { photoUrl: first });
            const profile = await profileService.updateProfile(user, { photoUrl: second });

            expect(profile.photoUrl).toBe(second);
            expect(await isStored(storage, first, user.id, StorageScope.ProfilePhoto)).toBe(false);
            expect(await isStored(storage, second, user.id, StorageScope.ProfilePhoto)).toBe(true);
        });

        it('deletes the photo when it is cleared', async () => {
            const photoUrl = await upload(storage, user.id, StorageScope.ProfilePhoto);
            await profileService.updateProfile(user, { photoUrl });

            const profile = await profileService.updateProfile(user, { photoUrl: null });

            expect(profile.photoUrl).toBeNull();
            expect(await isStored(storage, photoUrl, user.id, StorageScope.ProfilePhoto)).toBe(false);
        });

        it('keeps the photo when the form re-sends the one it already shows', async () => {
            const photoUrl = await upload(storage, user.id, StorageScope.ProfilePhoto);
            await profileService.updateProfile(user, { photoUrl });

            const profile = await profileService.updateProfile(user, { name: 'Олег', photoUrl });

            expect(profile.name).toBe('Олег');
            expect(profile.photoUrl).toBe(photoUrl);
            expect(await isStored(storage, photoUrl, user.id, StorageScope.ProfilePhoto)).toBe(true);
        });

        it('saves a new name even when the photo it re-sends has gone from the store', async () => {
            const photoUrl = await upload(storage, user.id, StorageScope.ProfilePhoto);
            await profileService.updateProfile(user, { photoUrl });
            await storage.discardReplaced(photoUrl, null, user.id, StorageScope.ProfilePhoto);

            // The URL is the row's own; re-checking it would lock the user
            // out of editing their name over a file they cannot see.
            const profile = await profileService.updateProfile(user, { name: 'Олег', photoUrl });

            expect(profile.name).toBe('Олег');
        });

        it('never deletes a file the old URL did not hold as this user’s profile photo', async () => {
            // A row written before the checks existed, pointing at one of the
            // user's support attachments — which a ticket still references.
            const attachment = await upload(storage, user.id, StorageScope.Feedback);
            await ctx.moduleRef.get(ProfileRepository).update(user.id, { photoUrl: attachment });

            const photoUrl = await upload(storage, user.id, StorageScope.ProfilePhoto);
            await profileService.updateProfile(user, { photoUrl });

            expect(await isStored(storage, attachment, user.id, StorageScope.Feedback)).toBe(true);
        });
    });

    describe('reminders', () => {
        it('saves the schedule as a unit', async () => {
            const updated = await remindersService.update(user.id, {
                reminders: [
                    { type: ReminderType.Breakfast, enabled: true, time: '07:30' },
                    { type: ReminderType.Snack, enabled: false, time: '11:00' },
                    { type: ReminderType.WeighIn, enabled: false },
                ],
            });

            const byType = new Map(updated.map(reminder => [reminder.type, reminder]));
            expect(byType.get(ReminderType.Breakfast)?.timeOfDay).toBe('07:30:00');
            expect(byType.get(ReminderType.Snack)?.enabled).toBe(false);
            expect(byType.get(ReminderType.WeighIn)?.enabled).toBe(false);

            // Cards the patch did not name keep their defaults.
            expect(byType.get(ReminderType.Dinner)?.enabled).toBe(true);
        });

        it('leaves the weigh-in cadence alone, since it is not editable here', async () => {
            const before = (await remindersService.list(user.id)).find(reminder => reminder.isWeighIn());

            const updated = await remindersService.update(user.id, {
                reminders: [{ type: ReminderType.WeighIn, enabled: false }],
            });

            const after = updated.find(reminder => reminder.isWeighIn());
            expect(after?.enabled).toBe(false);
            expect(after?.periodicityDays).toBe(before?.periodicityDays);
            expect(after?.nextFireAt?.toISOString()).toBe(before?.nextFireAt?.toISOString());
        });
    });

    describe('account deletion', () => {
        it('schedules the request a grace period out and keeps the session usable', async () => {
            const request = await deletionService.request(user.id);

            expect(request.isActive()).toBe(true);
            expect(Math.round((request.scheduledFor.getTime() - request.createdAt.getTime()) / DAY_MS)).toBe(30);

            // The account still answers: restoring is an authenticated call,
            // so revoking here would strand the user on the recovery screen.
            await expect(profileService.getAggregate(user)).resolves.toBeDefined();
            await expect(authService.login({ email: EMAIL, password: PASSWORD })).resolves.toHaveProperty(
                'accessToken',
            );
        });

        it('refuses a second request while one is pending', async () => {
            await deletionService.request(user.id);
            await expect(deletionService.request(user.id)).rejects.toBeInstanceOf(ConflictException);
        });

        it('cancels the request and allows a fresh one afterwards', async () => {
            await deletionService.request(user.id);
            await deletionService.cancel(user.id);

            expect(await deletionService.findActive(user.id)).toBeNull();
            await expect(deletionService.request(user.id)).resolves.toBeDefined();
        });

        it('explains a cancel with nothing pending rather than failing silently', async () => {
            await expect(deletionService.cancel(user.id)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
