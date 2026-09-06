import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { OtpPurpose } from '@dns/shared-types';

import { OtpCodeEntity } from '../../entities';
import { otpCodes } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertOtpCode = typeof otpCodes.$inferInsert;

@Injectable()
export class OtpCodeRepository extends BaseRepository {
    async create(data: InsertOtpCode): Promise<OtpCodeEntity> {
        const [row] = await this.db.insert(otpCodes).values(data).returning();
        if (!row) throw new Error('Failed to insert otp code');
        return OtpCodeEntity.from(row);
    }

    /**
     * The one code still in play for this flow, if any. At most one can exist:
     * issuing a new code deletes its predecessor.
     */
    async findActive(userId: string, purpose: OtpPurpose): Promise<OtpCodeEntity | null> {
        const row = await this.db.query.otpCodes.findFirst({
            where: and(eq(otpCodes.userId, userId), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt)),
        });
        return row ? OtpCodeEntity.from(row) : null;
    }

    /** A resend invalidates whatever came before (sign-up FR-006, password-reset FR-006). */
    async deleteAllFor(userId: string, purpose: OtpPurpose): Promise<void> {
        await this.db.delete(otpCodes).where(and(eq(otpCodes.userId, userId), eq(otpCodes.purpose, purpose)));
    }

    /**
     * Incremented in SQL rather than read-modify-write: two codes submitted at
     * once must both count, or the attempt cap could be walked past by racing.
     */
    async incrementAttempts(id: string): Promise<void> {
        await this.db
            .update(otpCodes)
            .set({ attempts: sql`${otpCodes.attempts} + 1` })
            .where(eq(otpCodes.id, id));
    }

    async markConsumed(id: string): Promise<void> {
        await this.db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, id));
    }
}
