import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { StorageService } from '@dns/api-infrastructure/storage';
import {
    ProfileEntity,
    ProfileRepository,
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

@Injectable()
export class ProfileService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly settingsRepository: UserSettingsRepository,
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

    // `async` for the same reason as FeedbackService.create: a failed
    // ownership check must reject, not throw synchronously.
    async updateProfile(user: UserEntity, input: UpdateProfileInput): Promise<ProfileEntity> {
        // Read only when the photo is in the patch: the stored URL is what
        // tells a new photo from the form re-sending the one it shows.
        const previous = input.photoUrl === undefined ? null : await this.profileRepository.findByUserId(user.id);
        const photoChanges = input.photoUrl !== undefined && input.photoUrl !== (previous?.photoUrl ?? null);

        // A photo URL is only accepted if this user uploaded it, for this
        // purpose, and the upload actually landed. Skipping the check would
        // turn `photoUrl` into a way to point every viewer of the profile at
        // any address on the internet, or at a file that does not exist.
        // The URL the row already holds is not re-checked: it passed when it
        // was written, and a stale file must not block saving a new name.
        if (photoChanges && input.photoUrl) {
            await this.storageService.validateUpload(input.photoUrl, user.id, StorageScope.ProfilePhoto);
        }

        const { targetWeightKg, ...rest } = input;

        const profile = await this.profileRepository.update(user.id, {
            ...rest,
            // `numeric` columns take strings; the fixed scale here is the same
            // one the questionnaire writes, so the two paths cannot disagree.
            ...(targetWeightKg === undefined
                ? {}
                : { targetWeightKg: targetWeightKg === null ? null : targetWeightKg.toFixed(1) }),
        });

        // Row first, file second. Deleting first and then failing the write
        // would leave the profile pointing at a file that is gone; this order
        // at worst leaves an orphan behind, and `discardReplaced` logs that
        // rather than failing an edit that did succeed.
        if (photoChanges && previous?.photoUrl) {
            await this.storageService.discardReplaced(
                previous.photoUrl,
                profile.photoUrl,
                user.id,
                StorageScope.ProfilePhoto,
            );
        }

        return profile;
    }

    updateSettings(user: UserEntity, input: UpdateSettingsInput): Promise<UserSettingsEntity> {
        return this.settingsRepository.update(user.id, input);
    }
}
