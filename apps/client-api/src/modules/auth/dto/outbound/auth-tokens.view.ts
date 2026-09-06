import { ApiProperty } from '@nestjs/swagger';

import { AuthTokens } from '@dns/shared-types';

export class AuthTokensView implements AuthTokens {
    @ApiProperty({ description: 'Bearer token for API calls. Short-lived.' })
    readonly accessToken: string;

    @ApiProperty({ description: 'Exchanged for a new pair at /auth/refresh. Single use.' })
    readonly refreshToken: string;

    private constructor(tokens: AuthTokens) {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
    }

    static from(tokens: AuthTokens): AuthTokensView {
        return new AuthTokensView(tokens);
    }
}
