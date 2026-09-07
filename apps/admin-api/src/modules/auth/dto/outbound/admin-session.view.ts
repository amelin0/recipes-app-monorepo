import { ApiProperty } from '@nestjs/swagger';

import { AdminEntity } from '@dns/database';
import { AdminSession } from '@dns/shared-types';

import { AdminProfileView } from './admin-profile.view';

export class AdminSessionView implements AdminSession {
    @ApiProperty({ description: 'Bearer token for API calls. Short-lived.' })
    readonly accessToken: string;

    @ApiProperty({ description: 'Exchanged for a new pair at /auth/refresh. Single use.' })
    readonly refreshToken: string;

    @ApiProperty({ type: AdminProfileView })
    readonly admin: AdminProfileView;

    private constructor(tokens: { accessToken: string; refreshToken: string }, admin: AdminEntity) {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.admin = AdminProfileView.from(admin);
    }

    static from(tokens: { accessToken: string; refreshToken: string }, admin: AdminEntity): AdminSessionView {
        return new AdminSessionView(tokens, admin);
    }
}
