import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm';

import { OtpPurpose } from '@dns/shared-types';

import { OtpCodeEntity } from '../../entities';
import { otpCodes } from '../../schema';
import { BaseRepository, DrizzleExecutor } from '../base.repository';

export interface IssueOtpCode {
    userId: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    /**
     * Sign-up only: the password to bind to this code. Omitted (or null), the
     * replacement keeps whatever password the code it replaces carried — a
     * resend does not know the password and must not drop it.
     */
    passwordHash?: string | null;
}

/**
 * Spends a code — once. The conditions are the guard, not a prior read: two
 * requests that both matched the code race here, and only the one whose UPDATE
 * finds the row still unconsumed gets it back. The other sees zero rows.
 *
 * Takes the executor so a flow can spend the code inside the same transaction
 * as whatever the code grants (a verified address, a reset permit): the grant
 * then exists if and only if the code was spent.
 */
export async function consumeOtpCode(executor: DrizzleExecutor, id: string): Promise<OtpCodeEntity | null> {
    const [row] = await executor
        .update(otpCodes)
        .set({ consumedAt: sql`now()` })
        .where(and(eq(otpCodes.id, id), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, sql`now()`)))
        .returning();

    return row ? OtpCodeEntity.from(row) : null;
}

@Injectable()
export class OtpCodeRepository extends BaseRepository {
    /**
     * Sweeps codes past their expiry.
     *
     * Consumed and burnt-out codes are kept only so a second attempt can be
     * told apart from a first one; after expiry that distinction is moot and
     * the rows are dead weight.
     *
     * One exception: the unconsumed sign-up code that carries a pending
     * password. Until the address is confirmed that row is the only place the
     * password exists, and signing in to an unconfirmed account (sign-in
     * FR-003 — 403 plus a fresh code) checks against it. Sweeping it would
     * turn «confirm your email» into «wrong password» for anyone who comes
     * back after the code expired. The unique index keeps it to one row per
     * unconfirmed account.
     */
    async deleteExpired(before: Date): Promise<number> {
        const deleted = await this.db
            .delete(otpCodes)
            .where(
                and(
                    lt(otpCodes.expiresAt, before),
                    sql`not (${otpCodes.consumedAt} is null and ${otpCodes.passwordHash} is not null)`,
                ),
            )
            .returning({ id: otpCodes.id });

        return deleted.length;
    }

    /**
     * Issues the flow's code, replacing whatever was live before (sign-up
     * FR-006, password-reset FR-006) — in one statement.
     *
     * An upsert against the partial unique index on unconsumed codes, rather
     * than delete-then-insert: two resends landing together would both delete
     * the same predecessor and both insert, leaving two live codes (or, with
     * the index, a unique violation on the loser). Here the second simply
     * overwrites the first.
     *
     * The replacement takes a NEW id. A check already in flight against the
     * old code holds the old id, so its consume (by id) finds nothing and the
     * superseded code cannot be spent after the resend. The attempt counter
     * restarts with the new code.
     */
    async issue({ userId, purpose, codeHash, expiresAt, passwordHash = null }: IssueOtpCode): Promise<OtpCodeEntity> {
        const [row] = await this.db
            .insert(otpCodes)
            .values({ userId, purpose, codeHash, expiresAt, passwordHash })
            .onConflictDoUpdate({
                target: [otpCodes.userId, otpCodes.purpose],
                targetWhere: sql`${otpCodes.consumedAt} is null`,
                set: {
                    id: sql`excluded.id`,
                    codeHash: sql`excluded.code_hash`,
                    attempts: 0,
                    expiresAt: sql`excluded.expires_at`,
                    createdAt: sql`now()`,
                    passwordHash: sql`coalesce(excluded.password_hash, ${otpCodes.passwordHash})`,
                },
            })
            .returning();

        if (!row) throw new Error('Failed to issue otp code');
        return OtpCodeEntity.from(row);
    }

    /**
     * The unconsumed code of this flow, if any — expired or not, the caller
     * decides what that means. The unique index allows at most one; the order
     * only makes the answer deterministic should that ever not hold.
     */
    async findActive(userId: string, purpose: OtpPurpose): Promise<OtpCodeEntity | null> {
        const [row] = await this.db
            .select()
            .from(otpCodes)
            .where(and(eq(otpCodes.userId, userId), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt)))
            .orderBy(desc(otpCodes.createdAt), desc(otpCodes.id))
            .limit(1);

        return row ? OtpCodeEntity.from(row) : null;
    }

    /**
     * Takes one attempt from the live code and hands it back for comparing —
     * or null when there is no live code, it has expired, or its attempts are
     * gone.
     *
     * The attempt is taken BEFORE the comparison, in the same statement that
     * checks the cap. Reading the counter first and incrementing after a wrong
     * guess lets N parallel guesses all read «0 used» and all be compared; a
     * conditional UPDATE serialises them on the row lock and re-checks
     * `attempts < max` for each, so at most `maxAttempts` comparisons ever
     * happen per code, however the requests interleave.
     */
    async reserveAttempt(userId: string, purpose: OtpPurpose, maxAttempts: number): Promise<OtpCodeEntity | null> {
        const [row] = await this.db
            .update(otpCodes)
            .set({ attempts: sql`${otpCodes.attempts} + 1` })
            .where(
                and(
                    eq(otpCodes.userId, userId),
                    eq(otpCodes.purpose, purpose),
                    isNull(otpCodes.consumedAt),
                    gt(otpCodes.expiresAt, sql`now()`),
                    lt(otpCodes.attempts, maxAttempts),
                ),
            )
            .returning();

        return row ? OtpCodeEntity.from(row) : null;
    }

    /**
     * The password a pending sign-up would activate — what signing in to an
     * unconfirmed account is checked against. Expiry does not matter here:
     * the password outlives its code until the address is confirmed.
     */
    async findPendingPasswordHash(userId: string): Promise<string | null> {
        const code = await this.findActive(userId, OtpPurpose.EmailVerification);
        return code?.passwordHash ?? null;
    }

    /** A completed password change voids the outstanding codes of the flow (password-reset FR-005). */
    async deleteAllFor(userId: string, purpose: OtpPurpose): Promise<void> {
        await this.db.delete(otpCodes).where(and(eq(otpCodes.userId, userId), eq(otpCodes.purpose, purpose)));
    }
}
