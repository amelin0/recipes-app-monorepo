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
        // A photo URL is only accepted if this user uploaded it, for this
        // purpose. Skipping the check would turn `photoUrl` into a way to
        // point every viewer of the profile at any address on the internet.
        if (input.photoUrl) {
            this.storageService.validateOwnership(input.photoUrl, user.id, StorageScope.ProfilePhoto);
        }

        const { targetWeightKg, ...rest } = input;

        return this.profileRepository.update(user.id, {
            ...rest,
            // `numeric` columns take strings; the fixed scale here is the same
            // one the questionnaire writes, so the two paths cannot disagree.
            ...(targetWeightKg === undefined
                ? {}
                : { targetWeightKg: targetWeightKg === null ? null : targetWeightKg.toFixed(1) }),
        });
    }

    updateSettings(user: UserEntity, input: UpdateSettingsInput): Promise<UserSettingsEntity> {
        return this.settingsRepository.update(user.id, input);
    }
}
