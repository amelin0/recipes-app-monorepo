import { OAuthProvider } from '@dns/shared-types';

import { oauthIdentities } from '../schema';

type OauthIdentityRow = typeof oauthIdentities.$inferSelect;

export class OAuthIdentityEntity {
    readonly id: string;
    readonly userId: string;
    readonly provider: OAuthProvider;
    readonly providerUserId: string;
    readonly createdAt: Date;

    private constructor(row: OauthIdentityRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.provider = row.provider as OAuthProvider;
        this.providerUserId = row.providerUserId;
        this.createdAt = row.createdAt;
    }

    static from(row: OauthIdentityRow): OAuthIdentityEntity {
        return new OAuthIdentityEntity(row);
    }
}
