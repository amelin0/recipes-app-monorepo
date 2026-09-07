import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

/**
 * The minimum an authenticated client needs to confirm whose session it holds.
 * The profile proper (name, goals, settings) belongs to the user domain.
 */
export class CurrentUserView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ example: 'user@example.com' })
    readonly email: string;

    @ApiProperty({ description: 'Null until the email is confirmed.', nullable: true })
    readonly emailVerifiedAt: string | null;

    @ApiProperty({
        nullable: true,
        description:
            'When the account is scheduled for deletion, or null. Non-null means the app must open the recovery screen instead of the app (account-deletion FR-003).',
    })
    readonly deletionScheduledFor: string | null;

    private constructor(user: UserEntity, deletionScheduledFor: Date | null) {
        this.id = user.id;
        this.email = user.email;
        this.emailVerifiedAt = user.emailVerifiedAt?.toISOString() ?? null;
        this.deletionScheduledFor = deletionScheduledFor?.toISOString() ?? null;
    }

    static from(user: UserEntity, deletionScheduledFor: Date | null = null): CurrentUserView {
        return new CurrentUserView(user, deletionScheduledFor);
    }
}
