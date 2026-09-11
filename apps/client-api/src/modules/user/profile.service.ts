import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { StorageService } from '@dns/api-infrastructure/storage';
import {
    ProfileEntity,
    ProfileRepository,
    SubscriptionEntity,
    SubscriptionRepository,
    UserEntity,
    UserSettingsEntity,
    UserSettingsRepository,
} from '@dns/database';
import { StorageScope } from '@dns/shared-types';
import { UpdateProfileInput, UpdateSettingsInput } from '@dns/validation';

export interface ProfileAggregate {
    profile: ProfileEntity;
    settings: UserSettingsEntity;
}

/** What the profile screen draws — the aggregate plus the «Підписка» row (FR-003). */
export interface ProfileScreen extends ProfileAggregate {
    /** Null on the free tier, and once the period has run out. */
    subscription: SubscriptionEntity | null;
}

@Injectable()
export class ProfileService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly settingsRepository: UserSettingsRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly storageService: StorageService,
    ) {}

    async getAggregate(user: UserEntity): Promise<ProfileAggregate> {
        const [profile, settings] = await Promise.all([
            this.profileRepository.findByUserId(user.id),
            this.settingsRepository.findByUserId(user.id),
        ]);

        // Both rows are written in the same transaction as the account, so a
        // missing one is a broken invariant rather than a state to handle —
        // a 500 that names it beats a null quietly reaching the client.
        if (!profile || !settings) {
            throw new InternalServerErrorException(`Account ${user.id} is missing its profile or settings row`);
        }

        return { profile, settings };
    }

    /**
     * The subscription is read through the same repository call that answers
     * `GET /subscription`, so the profile row and the subscription screen
     * cannot disagree (SC-005). Kept out of `getAggregate` because onboarding
     * reads that too and has no use for a subscription.
     */
    async getScreen(user: UserEntity): Promise<ProfileScreen> {
        const aggregate = await this.getAggregate(user);
        // Plan names are translated, so the language has to be known first —
        // and it is already on the settings row just read.
        const subscription = await this.subscriptionRepository.findActive(user.id, aggregate.settings.language);

        return { ...aggregate, subscription };
    }

    // `async` for the same reason as FeedbackService.create: a failed
    // ownership check must reject, not throw synchronously.
    async updateProfile(user: UserEntity, input: UpdateProfileInput): Promise<ProfileEntity> {
        const { targetWeightKg, ...rest } = input;
        const data = {
            ...rest,
            // `numeric` columns take strings; the fixed scale here is the same
            // one the questionnaire writes, so the two paths cannot disagree.
            ...(targetWeightKg === undefined
                ? {}
                : { targetWeightKg: targetWeightKg === null ? null : targetWeightKg.toFixed(1) }),
        };

        if (input.photoUrl === undefined) {
            return this.profileRepository.update(user.id, data);
        }

        // With a photo in the patch, both «is it a change?» and «may the old
        // file go?» are decided under the profile's row lock. The invariant:
        // the row always points at a file that is in the store.
        //
        // Take two concurrent edits — A re-sends the photo the form shows, B
        // sets a new one. Unlocked, both read the old row, B deletes the old
        // file, and A writes it back: a profile pointing at nothing. Locking
        // only the write is not enough either — B's delete would then run
        // after its commit, and A, next in line for the lock, could check the
        // old file while it still exists and write it back just before B
        // deletes it. Hence the delete also takes the lock and first re-reads
        // the row: if A has made the old file the photo again, it stays.
        const { before, after } = await this.profileRepository.updateLocked(user.id, async current => {
            // A photo URL is only accepted if this user uploaded it, for this
            // purpose, and the upload actually landed. Skipping the check would
            // turn `photoUrl` into a way to point every viewer of the profile at
            // any address on the internet, or at a file that does not exist.
            // The URL the row already holds is not re-checked: it passed when it
            // was written, and a stale file must not block saving a new name.
            if (input.photoUrl && input.photoUrl !== current.photoUrl) {
                await this.storageService.validateUpload(input.photoUrl, user.id, StorageScope.ProfilePhoto);
            }

            return data;
        });

        // Row first, file second, after the commit. Deleting first and then
        // failing the write would leave the profile pointing at a file that is
        // gone; this order at worst leaves an orphan behind, and
        // `discardReplaced` logs that rather than failing an edit that did
        // succeed.
        const discarded = before.photoUrl;
        if (discarded && discarded !== after.photoUrl) {
            await this.profileRepository.withRowLocked(user.id, async current => {
                // A concurrent edit made it the photo again since our commit.
                if (current.photoUrl === discarded) return;

                await this.storageService.discardReplaced(
                    discarded,
                    current.photoUrl,
                    user.id,
                    StorageScope.ProfilePhoto,
                );
            });
        }

        return after;
    }

    updateSettings(user: UserEntity, input: UpdateSettingsInput): Promise<UserSettingsEntity> {
        return this.settingsRepository.update(user.id, input);
    }
}
