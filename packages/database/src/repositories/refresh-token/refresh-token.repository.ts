import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { RefreshTokenEntity } from '../../entities';
import { refreshTokens } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertRefreshToken = typeof refreshTokens.$inferInsert;

@Injectable()
export class RefreshTokenRepository extends BaseRepository {
    async create(data: InsertRefreshToken): Promise<RefreshTokenEntity> {
        const [row] = await this.db.insert(refreshTokens).values(data).returning();
        if (!row) throw new Error('Failed to insert refresh token');
        return RefreshTokenEntity.from(row);
    }

    /** Looked up by the `jti` carried in the token, so a refresh is one indexed read. */
    async findById(id: string): Promise<RefreshTokenEntity | null> {
        const row = await this.db.query.refreshTokens.findFirst({ where: eq(refreshTokens.id, id) });
        return row ? RefreshTokenEntity.from(row) : null;
    }

    async markRotated(id: string): Promise<void> {
        await this.db.update(refreshTokens).set({ rotatedAt: new Date() }).where(eq(refreshTokens.id, id));
    }

    /**
     * Revokes one device's chain — used when a spent token is replayed, which
     * means it leaked. Other devices keep their sessions (session FR-006).
     */
    async deleteFamily(familyId: string): Promise<void> {
        await this.db.delete(refreshTokens).where(eq(refreshTokens.familyId, familyId));
    }

    /** Logout-everywhere, and the forced sign-out after a password change (session FR-007). */
    async deleteAllForUser(userId: string): Promise<void> {
        await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    }
}
