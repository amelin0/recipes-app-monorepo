import { ApiProperty } from '@nestjs/swagger';

import { ProfileEntity, UserEntity, UserSettingsEntity } from '@dns/database';

import { UserSettingsView } from './user-settings.view';

/**
 * What the profile screen needs in one read: identity, the avatar's inputs and
 * the current settings shown as row subtitles.
 *
 * Subscription state (profile FR-003) is absent until that domain ships —
 * adding the field later is backwards-compatible, inventing it now would mean
 * shipping a value nothing can populate.
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

    @ApiProperty({ type: UserSettingsView })
    readonly settings: UserSettingsView;

    private constructor(user: UserEntity, profile: ProfileEntity, settings: UserSettingsEntity) {
        this.id = user.id;
        this.email = user.email;
        this.name = profile.name;
        this.photoUrl = profile.photoUrl;
        this.initials = profile.initials();
        this.settings = UserSettingsView.from(settings);
    }

    static from(user: UserEntity, profile: ProfileEntity, settings: UserSettingsEntity): ProfileView {
        return new ProfileView(user, profile, settings);
    }
}
