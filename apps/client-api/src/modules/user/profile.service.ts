import { Injectable, InternalServerErrorException } from '@nestjs/common';

import {
    ProfileEntity,
    ProfileRepository,
    UserEntity,
    UserSettingsEntity,
    UserSettingsRepository,
} from '@dns/database';
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

    updateProfile(user: UserEntity, input: UpdateProfileInput): Promise<ProfileEntity> {
        return this.profileRepository.update(user.id, input);
    }

    updateSettings(user: UserEntity, input: UpdateSettingsInput): Promise<UserSettingsEntity> {
        return this.settingsRepository.update(user.id, input);
    }
}
