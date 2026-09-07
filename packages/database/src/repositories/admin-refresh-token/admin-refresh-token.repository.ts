import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { AdminRefreshTokenEntity } from '../../entities';
import { adminRefreshTokens } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertAdminRefreshToken = typeof adminRefreshTokens.$inferInsert;

@Injectable()
export class AdminRefreshTokenRepository extends BaseRepository {
    async create(data: InsertAdminRefreshToken): Promise<AdminRefreshTokenEntity> {
        const [row] = await this.db.insert(adminRefreshTokens).values(data).returning();
        if (!row) throw new Error('Failed to insert admin refresh token');
        return AdminRefreshTokenEntity.from(row);
    }

    /** Looked up by the `jti` carried in the token, so a refresh is one indexed read. */
    async findById(id: string): Promise<AdminRefreshTokenEntity | null> {
        const row = await this.db.query.adminRefreshTokens.findFirst({ where: eq(adminRefreshTokens.id, id) });
        return row ? AdminRefreshTokenEntity.from(row) : null;
    }

    async markRotated(id: string): Promise<void> {
        await this.db.update(adminRefreshTokens).set({ rotatedAt: new Date() }).where(eq(adminRefreshTokens.id, id));
    }

    /**
     * Revokes one browser's chain — on sign-out (FR-007), and on a replay,
     * which means the token leaked. The admin's other browsers keep working.
     */
    async deleteFamily(familyId: string): Promise<void> {
        await this.db.delete(adminRefreshTokens).where(eq(adminRefreshTokens.familyId, familyId));
    }

    /** Every session of one account — deactivation (FR-008) and password change. */
    async deleteAllForAdmin(adminId: string): Promise<void> {
        await this.db.delete(adminRefreshTokens).where(eq(adminRefreshTokens.adminId, adminId));
    }
}
