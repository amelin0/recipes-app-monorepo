import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { PasswordResetPermitEntity } from '../../entities';
import { passwordResetPermits } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertPasswordResetPermit = typeof passwordResetPermits.$inferInsert;

@Injectable()
export class PasswordResetPermitRepository extends BaseRepository {
    async create(data: InsertPasswordResetPermit): Promise<PasswordResetPermitEntity> {
        const [row] = await this.db.insert(passwordResetPermits).values(data).returning();
        if (!row) throw new Error('Failed to insert password reset permit');
        return PasswordResetPermitEntity.from(row);
    }

    /** Looked up by the `jti` carried in the permit token. */
    async findById(id: string): Promise<PasswordResetPermitEntity | null> {
        const row = await this.db.query.passwordResetPermits.findFirst({
            where: eq(passwordResetPermits.id, id),
        });
        return row ? PasswordResetPermitEntity.from(row) : null;
    }

    async markConsumed(id: string): Promise<void> {
        await this.db
            .update(passwordResetPermits)
            .set({ consumedAt: new Date() })
            .where(eq(passwordResetPermits.id, id));
    }

    /** A completed password change voids every outstanding permit (password-reset FR-005). */
    async deleteAllForUser(userId: string): Promise<void> {
        await this.db.delete(passwordResetPermits).where(eq(passwordResetPermits.userId, userId));
    }
}
