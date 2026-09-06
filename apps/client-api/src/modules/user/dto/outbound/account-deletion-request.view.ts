import { ApiProperty } from '@nestjs/swagger';

import { AccountDeletionRequestEntity } from '@dns/database';
import { AccountDeletionState } from '@dns/shared-types';

export class AccountDeletionRequestView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ description: 'When the request was raised.' })
    readonly requestedAt: string;

    @ApiProperty({ description: 'When the grace period ends. The recovery screen counts down to this.' })
    readonly scheduledFor: string;

    @ApiProperty({ enum: AccountDeletionState })
    readonly state: AccountDeletionState;

    private constructor(request: AccountDeletionRequestEntity) {
        this.id = request.id;
        this.requestedAt = request.createdAt.toISOString();
        this.scheduledFor = request.scheduledFor.toISOString();
        this.state = request.state();
    }

    static from(request: AccountDeletionRequestEntity): AccountDeletionRequestView {
        return new AccountDeletionRequestView(request);
    }
}
