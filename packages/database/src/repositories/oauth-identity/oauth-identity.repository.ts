import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { OAuthProvider } from '@dns/shared-types';

import { OAuthIdentityEntity, UserEntity } from '../../entities';
import { oauthIdentities } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertOAuthIdentity = typeof oauthIdentities.$inferInsert;

export interface OAuthIdentityWithUser {
    identity: OAuthIdentityEntity;
    user: UserEntity;
}

@Injectable()
export class OAuthIdentityRepository extends BaseRepository {
    /**
     * Keyed on the provider's stable user id, never the email: Apple's private
     * relay address can change, and matching on it would cut the owner off
     * from their own account.
     */
    async findByProviderUserId(provider: OAuthProvider, providerUserId: string): Promise<OAuthIdentityWithUser | null> {
        const row = await this.db.query.oauthIdentities.findFirst({
            where: and(eq(oauthIdentities.provider, provider), eq(oauthIdentities.providerUserId, providerUserId)),
            with: { user: true },
        });

        if (!row) return null;

        return { identity: OAuthIdentityEntity.from(row), user: UserEntity.from(row.user) };
    }

    async create(data: InsertOAuthIdentity): Promise<OAuthIdentityEntity> {
        const [row] = await this.db.insert(oauthIdentities).values(data).returning();
        if (!row) throw new Error('Failed to insert oauth identity');
        return OAuthIdentityEntity.from(row);
    }
}
