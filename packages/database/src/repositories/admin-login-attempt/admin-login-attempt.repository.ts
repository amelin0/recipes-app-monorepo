import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, lt } from 'drizzle-orm';

import { adminLoginAttempts } from '../../schema';
import { BaseRepository } from '../base.repository';

export interface RecordAttemptInput {
    email: string;
    adminId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    succeeded: boolean;
}

export interface LoginAttemptRow {
    id: string;
    email: string;
    adminId: string | null;
    ip: string | null;
    userAgent: string | null;
    succeeded: boolean;
    createdAt: Date;
}

@Injectable()
export class AdminLoginAttemptRepository extends BaseRepository {
    /**
     * Writes the journal entry for one attempt (sign-in FR-009).
     *
     * Returns nothing and is expected to be called without blocking the
     * response: a login must not fail because the audit write did. The caller
     * owns that decision — see the note where it is used.
     */
    async record(input: RecordAttemptInput): Promise<void> {
        await this.db.insert(adminLoginAttempts).values({
            email: input.email,
            adminId: input.adminId ?? null,
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
            succeeded: input.succeeded,
        });
    }

    /** Recent attempts for one address, newest first — what an investigation reads. */
    async findRecentByEmail(email: string, limit = 50): Promise<LoginAttemptRow[]> {
        return this.db
            .select()
            .from(adminLoginAttempts)
            .where(eq(adminLoginAttempts.email, email))
            .orderBy(desc(adminLoginAttempts.createdAt))
            .limit(limit);
    }

    /** How many failures for this address since a moment — the lockout counter. */
    async countFailuresSince(email: string, since: Date): Promise<number> {
        const rows = await this.db
            .select({ id: adminLoginAttempts.id })
            .from(adminLoginAttempts)
            .where(
                and(
                    eq(adminLoginAttempts.email, email),
                    eq(adminLoginAttempts.succeeded, false),
                    gt(adminLoginAttempts.createdAt, since),
                ),
            );
        return rows.length;
    }

    /**
     * Drops entries older than the cutoff. The table grows on **attacker**
     * traffic — one row per guess — so this is part of the feature, not a
     * later chore.
     */
    async pruneOlderThan(cutoff: Date): Promise<number> {
        const rows = await this.db
            .delete(adminLoginAttempts)
            .where(lt(adminLoginAttempts.createdAt, cutoff))
            .returning({ id: adminLoginAttempts.id });
        return rows.length;
    }
}
