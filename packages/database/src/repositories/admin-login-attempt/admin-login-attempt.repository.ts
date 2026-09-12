import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, lt, sql } from 'drizzle-orm';

import { adminLoginAttempts } from '../../schema';
import { BaseRepository } from '../base.repository';

export interface OpenAttemptInput {
    email: string;
    adminId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
}

export interface OpenedAttempt {
    attemptId: string;
    /** Failures for the address inside the window — this attempt included. */
    failures: number;
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
     * Journals an attempt as **failed** before its password is looked at, then
     * counts the address's failures in the window with it included — the
     * lockout counter (sign-in FR-006) and the journal (FR-009) in one row.
     *
     * The order is the guard. Counting first and recording after the ~250 ms
     * of bcrypt let a burst of N parallel guesses all count the same «fewer
     * than five» and all be checked. Here each guess is visible to every
     * other before any of them counts:
     *
     * - the two statements are **separate autocommits, deliberately not one
     *   transaction** — inside a transaction the row would stay invisible to
     *   the other guesses until commit, and two of them could each count only
     *   themselves; a single `INSERT … RETURNING` + count statement has the
     *   same flaw, since both halves share one snapshot;
     * - the k-th insert to commit is followed by a count that already sees at
     *   least k rows, so at most `limit` attempts can see `failures <= limit`.
     *
     * The cap is therefore exact from above: never more than `limit` password
     * checks per window, however the requests interleave. It can err the
     * other way — a guess may count a neighbour still in flight — which is
     * the side a lockout should err on. No connection or lock is held through
     * bcrypt. A correct password turns its own row back with `markSucceeded`.
     *
     * The window is measured on the database clock, the same one that stamped
     * `created_at`, so app-server skew cannot shift it.
     */
    async openAttempt(input: OpenAttemptInput, windowMinutes: number): Promise<OpenedAttempt> {
        const [row] = await this.db
            .insert(adminLoginAttempts)
            .values({
                email: input.email,
                adminId: input.adminId ?? null,
                ip: input.ip ?? null,
                userAgent: input.userAgent ?? null,
                succeeded: false,
            })
            .returning({ id: adminLoginAttempts.id });
        if (!row) throw new Error('Failed to insert admin login attempt');

        const [counted] = await this.db
            .select({ failures: sql<number>`count(*)::int` })
            .from(adminLoginAttempts)
            .where(
                and(
                    eq(adminLoginAttempts.email, input.email),
                    eq(adminLoginAttempts.succeeded, false),
                    gt(adminLoginAttempts.createdAt, sql`now() - make_interval(mins => ${windowMinutes}::int)`),
                ),
            );

        return { attemptId: row.id, failures: counted?.failures ?? 0 };
    }

    /** Turns an attempt opened by `openAttempt` into the success it turned out to be. */
    async markSucceeded(attemptId: string): Promise<void> {
        await this.db
            .update(adminLoginAttempts)
            .set({ succeeded: true })
            .where(and(eq(adminLoginAttempts.id, attemptId), eq(adminLoginAttempts.succeeded, false)));
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
