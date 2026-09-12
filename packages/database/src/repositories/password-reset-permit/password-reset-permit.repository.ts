import { Injectable } from '@nestjs/common';
import { eq, lt } from 'drizzle-orm';

import { PasswordResetPermitEntity } from '../../entities';
import { passwordResetPermits } from '../../schema';
import { BaseRepository } from '../base.repository';
import { consumeOtpCode } from '../otp-code/otp-code.repository';

export interface CreatePermitFromCode {
    /** The reset code the caller has just checked (and not yet spent). */
    codeId: string;
    /** Travels in the permit token as `jti`, so it is chosen before the row exists. */
    permitId: string;
    expiresAt: Date;
}

@Injectable()
export class PasswordResetPermitRepository extends BaseRepository {
    /** Sweeps permits past their expiry — an expired permit opens nothing. */
    async deleteExpired(before: Date): Promise<number> {
        const deleted = await this.db
            .delete(passwordResetPermits)
            .where(lt(passwordResetPermits.expiresAt, before))
            .returning({ id: passwordResetPermits.id });

        return deleted.length;
    }

    /**
     * Spends the reset code and issues the permit it buys, in one transaction
     * (password-reset FR-003).
     *
     * The permit exists if and only if THIS call spent the code: two requests
     * carrying the same correct code both pass the comparison, but only one
     * conditional consume returns a row, and the other inserts nothing. As two
     * separate statements, both would have walked away with a permit.
     */
    async createFromCode({
        codeId,
        permitId,
        expiresAt,
    }: CreatePermitFromCode): Promise<PasswordResetPermitEntity | null> {
        return this.db.transaction(async tx => {
            const code = await consumeOtpCode(tx, codeId);
            if (!code) return null;

            const [row] = await tx
                .insert(passwordResetPermits)
                .values({ id: permitId, userId: code.userId, expiresAt })
                .returning();
            if (!row) throw new Error('Failed to insert password reset permit');

            return PasswordResetPermitEntity.from(row);
        });
    }

    /** Looked up by the `jti` carried in the permit token. */
    async findById(id: string): Promise<PasswordResetPermitEntity | null> {
        const row = await this.db.query.passwordResetPermits.findFirst({
            where: eq(passwordResetPermits.id, id),
        });
        return row ? PasswordResetPermitEntity.from(row) : null;
    }
}
