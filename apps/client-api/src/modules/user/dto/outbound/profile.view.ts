import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { SubscriptionView } from '../../../subscription/dto';
import { ProfileScreen } from '../../profile.service';

import { UserSettingsView } from './user-settings.view';

/**
 * What the profile screen needs in one read: identity, the avatar's inputs,
 * the current settings shown as row subtitles, and the «Підписка» row.
 */
export class ProfileView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ example: 'user@example.com' })
    readonly email: string;

    @ApiProperty({ nullable: true, description: 'Null until the questionnaire or the edit screen sets it.' })
    readonly name: string | null;

    @ApiProperty({ nullable: true })
    readonly photoUrl: string | null;

    @ApiProperty({ example: 'ОЧ', description: 'Avatar fallback; derived from the name so every surface agrees.' })
    readonly initials: string;

    @ApiProperty({
        nullable: true,
        description: 'The weight being worked towards; null when there is none, or the goal is not about weight.',
    })
    readonly targetWeightKg: number | null;

    @ApiProperty({ type: UserSettingsView })
    readonly settings: UserSettingsView;

    @ApiProperty({
        type: SubscriptionView,
        nullable: true,
        description:
            'The same object `GET /subscription` returns — tag from `planName`, «До …» from `expiresAt` (FR-003). ' +
            'Null on the free tier; how that row reads is the client’s copy.',
    })
    readonly subscription: SubscriptionView | null;

    private constructor(user: UserEntity, { profile, settings, subscription }: ProfileScreen) {
        this.id = user.id;
        this.email = user.email;
        this.name = profile.name;
        this.photoUrl = profile.photoUrl;
        this.initials = profile.initials();
        // Echoed back because `PATCH /profile` accepts it: a client that sets a
        // field and gets a body without it cannot tell the write took.
        this.targetWeightKg = profile.targetWeightKg;
        this.settings = UserSettingsView.from(settings);
        // The subscription screen's own view rather than a narrower one: two
        // shapes of one row would be two places for the same date to drift.
        this.subscription = subscription ? SubscriptionView.from(subscription) : null;
    }

    static from(user: UserEntity, screen: ProfileScreen): ProfileView {
        return new ProfileView(user, screen);
    }
}
