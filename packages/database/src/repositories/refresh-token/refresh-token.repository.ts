import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNotNull, isNull, lt, sql } from 'drizzle-orm';

import { RefreshTokenEntity, UserEntity } from '../../entities';
import { refreshTokens, users } from '../../schema';
import { BaseRepository, DrizzleExecutor } from '../base.repository';

/** A refresh token minted (signed and hashed) before the transaction that stores it. */
export interface NewRefreshToken {
    /** Travels in the JWT as `jti`. */
    id: string;
    tokenHash: string;
    expiresAt: Date;
}

/** What opening a session came to. The service maps each outcome to a response. */
export type SessionGrant =
    | { outcome: 'granted'; user: UserEntity }
    | { outcome: 'blocked' }
    /** Gone, unconfirmed, or its password changed since the caller checked it. */
    | { outcome: 'refused' };

/** What presenting a refresh token came to. */
export type RotationResult =
    /** The token was live and is now spent; `child` continues the chain. */
    | { outcome: 'rotated'; user: UserEntity }
    /** A second refresh inside the grace window; `child` is a sibling on the same chain. */
    | { outcome: 'grace'; user: UserEntity }
    | { outcome: 'blocked' }
    /** A spent token presented again past its grace: the chain has been revoked. */
    | { outcome: 'replay' }
    /** Unknown, revoked or expired — nothing was changed. */
    | { outcome: 'refused' };

/**
 * # Why sessions and revocations cannot miss each other
 *
 * Every write that hands out a refresh token (sign-in, rotation) and every
 * revocation (logout, logout-everywhere, password reset, block) first locks
 * the account's `users` row, and the two sides take CONFLICTING locks:
 *
 * - issuing takes `FOR SHARE` — concurrent refreshes of one account, from its
 *   different devices, do not wait for each other;
 * - revoking takes `FOR NO KEY UPDATE` (a plain `UPDATE users` takes the same
 *   one) — which conflicts with `FOR SHARE`, but not with the `FOR KEY SHARE`
 *   that foreign-key checks from unrelated inserts take, so it does not stall
 *   the account's meal logs.
 *
 * So one side always waits for the other to commit. If the revocation waits,
 * its DELETE runs after the issue committed and — being a new statement under
 * READ COMMITTED — sees the new token and deletes it. If the issue waits, it
 * re-reads the account (blocked?) and finds its parent token already gone.
 * Before this, a revocation landing between a refresh's read and its insert
 * was silently lost: the new token survived logout-everywhere.
 *
 * READ COMMITTED is load-bearing, not a default left alone: under REPEATABLE
 * READ the revocation's DELETE would read from a snapshot taken before it
 * waited, and miss exactly the token the lock was there to catch.
 */
@Injectable()
export class RefreshTokenRepository extends BaseRepository {
    /**
     * Sweeps rows whose expiry has passed.
     *
     * Spent tokens are kept deliberately — a replay is only detectable while
     * the row exists (ADR-0003) — but that detection has a shelf life: once the
     * token could no longer be accepted anyway, the row proves nothing and only
     * grows the table.
     */
    async deleteExpired(before: Date): Promise<number> {
        const deleted = await this.db
            .delete(refreshTokens)
            .where(lt(refreshTokens.expiresAt, before))
            .returning({ id: refreshTokens.id });

        return deleted.length;
    }

    /** Looked up by the `jti` carried in the token, so a refresh is one indexed read. */
    async findById(id: string): Promise<RefreshTokenEntity | null> {
        const row = await this.db.query.refreshTokens.findFirst({ where: eq(refreshTokens.id, id) });
        return row ? RefreshTokenEntity.from(row) : null;
    }

    /**
     * Starts a new chain for a fresh sign-in, re-checking the account under
     * the session lock: a block or a password change that committed after the
     * caller read the account wins over the sign-in.
     *
     * `expectedPasswordHash` is the hash the caller verified the password
     * against; if the account's differs now, a password reset got in between
     * and the old password must not open a session.
     */
    async openSession({
        userId,
        familyId,
        token,
        expectedPasswordHash,
    }: {
        userId: string;
        familyId: string;
        token: NewRefreshToken;
        expectedPasswordHash?: string | null;
    }): Promise<SessionGrant> {
        return this.db.transaction(async tx => {
            const user = await lockAccountForSession(tx, userId);

            if (!user || user.emailVerifiedAt === null) return { outcome: 'refused' };
            if (user.blockedAt !== null) return { outcome: 'blocked' };
            if (expectedPasswordHash !== undefined && user.passwordHash !== expectedPasswordHash) {
                return { outcome: 'refused' };
            }

            await tx.insert(refreshTokens).values({ ...token, userId, familyId });

            return { outcome: 'granted', user: UserEntity.from(user) };
        });
    }

    /**
     * Exchanges a refresh token for `child`, atomically. The caller has already
     * checked the token's signature and its digest — bcrypt runs outside, so
     * no lock is held for the length of a hash.
     *
     * In one transaction, under the account's session lock:
     * 1. the account must still be confirmed and not blocked;
     * 2. `rotated_at` is set only `WHERE rotated_at IS NULL AND expires_at >
     *    now()` — of N refreshes racing on one token exactly one gets a row
     *    back and continues the chain with `child`;
     * 3. a loser arriving within `graceSeconds` of that rotation may claim the
     *    token's single grace (`WHERE grace_used_at IS NULL`) and gets `child`
     *    as a sibling on the same chain;
     * 4. anyone else holding a spent token is a replay.
     *
     * A replay revokes the chain in a SECOND transaction, which takes the
     * revoking lock. It therefore waits for every rotation still in flight on
     * the account — a sibling being minted right now included — and deletes
     * their tokens too. Doing it inside the first transaction would mean
     * upgrading a shared lock that other refreshes also hold: a deadlock.
     */
    async rotate({
        tokenId,
        userId,
        child,
        graceSeconds,
    }: {
        tokenId: string;
        userId: string;
        child: NewRefreshToken;
        graceSeconds: number;
    }): Promise<RotationResult> {
        const result = await this.db.transaction(
            async (tx): Promise<RotationResult | { outcome: 'spent'; familyId: string }> => {
                const user = await lockAccountForSession(tx, userId);

                if (!user || user.emailVerifiedAt === null) return { outcome: 'refused' };
                if (user.blockedAt !== null) return { outcome: 'blocked' };

                const [rotated] = await tx
                    .update(refreshTokens)
                    .set({ rotatedAt: sql`now()` })
                    .where(
                        and(
                            eq(refreshTokens.id, tokenId),
                            eq(refreshTokens.userId, userId),
                            isNull(refreshTokens.rotatedAt),
                            gt(refreshTokens.expiresAt, sql`now()`),
                        ),
                    )
                    .returning({ familyId: refreshTokens.familyId });

                if (rotated) {
                    await tx.insert(refreshTokens).values({ ...child, userId, familyId: rotated.familyId });
                    return { outcome: 'rotated', user: UserEntity.from(user) };
                }

                const [graced] = await tx
                    .update(refreshTokens)
                    .set({ graceUsedAt: sql`now()` })
                    .where(
                        and(
                            eq(refreshTokens.id, tokenId),
                            eq(refreshTokens.userId, userId),
                            isNotNull(refreshTokens.rotatedAt),
                            gt(refreshTokens.rotatedAt, sql`now() - make_interval(secs => ${graceSeconds})`),
                            isNull(refreshTokens.graceUsedAt),
                            gt(refreshTokens.expiresAt, sql`now()`),
                        ),
                    )
                    .returning({ familyId: refreshTokens.familyId });

                if (graced) {
                    await tx.insert(refreshTokens).values({ ...child, userId, familyId: graced.familyId });
                    return { outcome: 'grace', user: UserEntity.from(user) };
                }

                // Neither: either the row is gone (revoked, unknown) or expired, or
                // it is a spent token presented again with its grace used up or
                // past. Only the last is theft.
                const [spent] = await tx
                    .select({ familyId: refreshTokens.familyId, rotatedAt: refreshTokens.rotatedAt })
                    .from(refreshTokens)
                    .where(eq(refreshTokens.id, tokenId));

                return spent?.rotatedAt ? { outcome: 'spent', familyId: spent.familyId } : { outcome: 'refused' };
            },
        );

        if (result.outcome !== 'spent') return result;

        // The genuine token, presented once too often. Only theft explains
        // that, so the whole chain goes — and only that chain, leaving the
        // user's other devices signed in (session FR-006).
        await this.deleteFamily(userId, result.familyId);
        return { outcome: 'replay' };
    }

    /**
     * Revokes one device's chain — on logout, and when a spent token is
     * replayed, which means it leaked. Other devices keep their sessions
     * (session FR-006). Takes the revoking lock first; see the class comment.
     */
    async deleteFamily(userId: string, familyId: string): Promise<void> {
        await this.db.transaction(async tx => {
            await lockAccountForRevocation(tx, userId);
            await tx
                .delete(refreshTokens)
                .where(and(eq(refreshTokens.familyId, familyId), eq(refreshTokens.userId, userId)));
        });
    }

    /**
     * Logout-everywhere, and the sign-out a block forces (session FR-007).
     * Takes the revoking lock first, so a refresh in flight cannot leave a
     * token behind; see the class comment. (A password reset revokes inside
     * its own transaction — `UserRepository.resetPasswordWithPermit`.)
     *
     * Deleting the chains is only half of it: the access tokens already handed
     * out are stateless and cannot be deleted at all. `sessions_valid_from` is
     * what turns them off, in this same transaction under the same lock — a
     * marker written here but a refusal enforced in `JwtStrategy`.
     */
    async deleteAllForUser(userId: string): Promise<void> {
        await this.db.transaction(async tx => {
            await lockAccountForRevocation(tx, userId);
            await tx.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
            await endIssuedAccessTokens(tx, userId);
        });
    }
}

/**
 * Marks every access token issued so far as no longer belonging to a session.
 *
 * `clock_timestamp()` rather than `now()`, and the difference is the whole
 * point: `now()` is the TRANSACTION's start time, taken before this
 * transaction waited for the revocation lock. A sign-in that committed during
 * that wait would carry an `iat` later than such a marker and would survive
 * the revocation it just lost the race to — the same lost-update this lock
 * exists to prevent, moved from the rows to the marker. `clock_timestamp()` is
 * read when this statement runs, which is after the wait.
 *
 * Caller must already hold the revocation lock on the row.
 */
async function endIssuedAccessTokens(tx: DrizzleExecutor, userId: string): Promise<void> {
    await tx
        .update(users)
        .set({ sessionsValidFrom: sql`clock_timestamp()` })
        .where(eq(users.id, userId));
}

/** The issuing side of the session lock — see the class comment. */
async function lockAccountForSession(
    tx: DrizzleExecutor,
    userId: string,
): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('share');
    return user;
}

/** The revoking side of the session lock — see the class comment. */
async function lockAccountForRevocation(tx: DrizzleExecutor, userId: string): Promise<void> {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('no key update');
}
