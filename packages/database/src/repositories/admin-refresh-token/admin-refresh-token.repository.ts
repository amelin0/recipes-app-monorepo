import { Injectable } from '@nestjs/common';
import { and, eq, gt, gte, isNotNull, isNull, sql } from 'drizzle-orm';

import { AdminEntity, AdminRefreshTokenEntity } from '../../entities';
import { adminRefreshTokens, admins } from '../../schema';
import { BaseRepository, DrizzleDB } from '../base.repository';

/**
 * A refresh token minted — and bcrypt-hashed — **before** the transaction
 * that stores it opens. Hashing at cost 12 is ~250 ms; doing it with the
 * admin row locked would hold that lock, and a pooled connection, for the
 * whole of it.
 */
export interface PreparedAdminRefreshToken {
    id: string;
    tokenHash: string;
    expiresAt: Date;
}

export interface RotateAdminRefreshTokenInput {
    /** The presented token's row — its `jti`, already matched against the stored digest. */
    presentedId: string;
    /** Whose row it is, as read before the transaction. Re-read under the lock, never trusted. */
    adminId: string;
    graceSeconds: number;
    successor: PreparedAdminRefreshToken;
}

/**
 * How a rotation ended. The service turns everything but the first two into
 * the same 401; the distinction exists for the tests and for reading the code.
 */
export type AdminRefreshRotation =
    /** The token was live; it is spent now and `successor` continues the chain. */
    | { outcome: 'rotated'; admin: AdminEntity }
    /** A just-spent token inside the window, claiming its one sibling pair. */
    | { outcome: 'grace'; admin: AdminEntity }
    /** A spent token past the window or past its one sibling: the chain is gone. */
    | { outcome: 'replay' }
    /** Unknown, revoked, expired, or the account can no longer sign in. */
    | { outcome: 'rejected' };

/**
 * Sessions of staff accounts.
 *
 * **One rule carries every method that writes:** it opens a transaction and
 * locks the owning `admins` row `FOR UPDATE` before touching this table.
 * Issuing, rotating, logging out, logging out everywhere, deactivating
 * (`AdminRepository.updateAccess`) — all of them. That single lock is what
 * turns «a revocation racing an in-flight refresh» into two transactions that
 * run one after the other:
 *
 * - revocation first → the refresh, once it gets the lock, re-reads the row
 *   and finds the account inactive or its token gone;
 * - refresh first → the revocation's `DELETE`, a new statement under READ
 *   COMMITTED, sees the successor the refresh just committed and removes it.
 *
 * Without the lock the second case loses: the `DELETE`'s snapshot predates the
 * successor's `INSERT`, and a signed-out browser keeps a live token.
 *
 * READ COMMITTED is chosen, not defaulted: the row lock already serialises
 * everything that matters, and each statement after it takes a fresh snapshot
 * that includes whatever the previous lock holder committed. SERIALIZABLE
 * would add nothing here but `40001` retries the callers would have to handle.
 */
@Injectable()
export class AdminRefreshTokenRepository extends BaseRepository {
    /**
     * Opens a new chain on sign-in — if, under the lock, the account can
     * still sign in. Returns the account as it stands then, or `null`.
     *
     * The check is repeated here because sign-in read the row ~250 ms earlier,
     * before bcrypt. A deactivation landing in that gap must not be followed
     * by a fresh session for the account it just closed.
     */
    async openChain(adminId: string, familyId: string, token: PreparedAdminRefreshToken): Promise<AdminEntity | null> {
        return this.db.transaction(
            async tx => {
                const admin = await lockAdmin(tx, adminId);
                if (!admin?.canSignIn()) return null;

                await tx.insert(adminRefreshTokens).values({ ...token, adminId, familyId });
                return admin;
            },
            { isolationLevel: 'read committed' },
        );
    }

    /** Looked up by the `jti` carried in the token, so a refresh is one indexed read. */
    async findById(id: string): Promise<AdminRefreshTokenEntity | null> {
        const row = await this.db.query.adminRefreshTokens.findFirst({ where: eq(adminRefreshTokens.id, id) });
        return row ? AdminRefreshTokenEntity.from(row) : null;
    }

    /**
     * Exchanges a presented token for its successor — decided and written in
     * one transaction under the admin row lock (see the class note).
     *
     * Every step is a conditional statement, so the answer comes from the row
     * as it is now, not as the caller read it before bcrypt:
     *
     * 1. the account must still be able to sign in;
     * 2. `rotated_at IS NULL AND expires_at > now()` — only one caller can win
     *    this, however many present the same token;
     * 3. otherwise `grace_used_at IS NULL` inside the window — only one caller
     *    can win *that*, so the window is one extra pair, not a tap;
     * 4. otherwise, a spent token is a replay and the chain goes.
     *
     * Times are the database's `now()`, on both sides of the window, so the
     * app server's clock cannot widen or shut it.
     */
    async rotate(input: RotateAdminRefreshTokenInput): Promise<AdminRefreshRotation> {
        const { presentedId, adminId, graceSeconds, successor } = input;

        return this.db.transaction(
            async (tx): Promise<AdminRefreshRotation> => {
                const admin = await lockAdmin(tx, adminId);
                // Deactivation deletes the rows as well, so this is the second
                // line of defence — the one that holds for a row that survived
                // a partial failure.
                if (!admin?.canSignIn()) return { outcome: 'rejected' };

                const [rotated] = await tx
                    .update(adminRefreshTokens)
                    .set({ rotatedAt: sql`now()` })
                    .where(
                        and(
                            eq(adminRefreshTokens.id, presentedId),
                            eq(adminRefreshTokens.adminId, adminId),
                            isNull(adminRefreshTokens.rotatedAt),
                            gt(adminRefreshTokens.expiresAt, sql`now()`),
                        ),
                    )
                    .returning({ familyId: adminRefreshTokens.familyId });

                if (rotated) {
                    await tx.insert(adminRefreshTokens).values({ ...successor, adminId, familyId: rotated.familyId });
                    return { outcome: 'rotated', admin };
                }

                // Two tabs refreshed at the same instant. The loser holds the
                // same genuine token, not a stolen one, so it gets a pair of its
                // own on the chain rather than signing the admin out mid-edit —
                // once. A *second* sibling has no benign explanation the first
                // does not already cover, so it falls through to the replay.
                const [graced] = await tx
                    .update(adminRefreshTokens)
                    .set({ graceUsedAt: sql`now()` })
                    .where(
                        and(
                            eq(adminRefreshTokens.id, presentedId),
                            eq(adminRefreshTokens.adminId, adminId),
                            isNotNull(adminRefreshTokens.rotatedAt),
                            isNull(adminRefreshTokens.graceUsedAt),
                            gte(adminRefreshTokens.rotatedAt, sql`now() - make_interval(secs => ${graceSeconds}::int)`),
                        ),
                    )
                    .returning({ familyId: adminRefreshTokens.familyId });

                if (graced) {
                    await tx.insert(adminRefreshTokens).values({ ...successor, adminId, familyId: graced.familyId });
                    return { outcome: 'grace', admin };
                }

                const [current] = await tx
                    .select({ familyId: adminRefreshTokens.familyId, rotatedAt: adminRefreshTokens.rotatedAt })
                    .from(adminRefreshTokens)
                    .where(and(eq(adminRefreshTokens.id, presentedId), eq(adminRefreshTokens.adminId, adminId)));

                // Gone (logged out, revoked, a replay already took the chain)
                // or simply expired unspent: nothing to punish.
                if (!current?.rotatedAt) return { outcome: 'rejected' };

                // Past the window, or past its one sibling: only theft explains
                // it. The whole chain goes — and only that chain, leaving the
                // admin's other browsers signed in.
                await tx.delete(adminRefreshTokens).where(eq(adminRefreshTokens.familyId, current.familyId));
                return { outcome: 'replay' };
            },
            { isolationLevel: 'read committed' },
        );
    }

    /**
     * Revokes one browser's chain on sign-out (FR-007). The admin's other
     * browsers keep working.
     *
     * Under the admin row lock like every other write: a refresh of this very
     * chain that is mid-transaction commits its successor first, and this
     * `DELETE` — a later statement — sees and removes it.
     */
    async deleteFamily(adminId: string, familyId: string): Promise<void> {
        await this.db.transaction(
            async tx => {
                await lockAdmin(tx, adminId);
                await tx
                    .delete(adminRefreshTokens)
                    .where(and(eq(adminRefreshTokens.familyId, familyId), eq(adminRefreshTokens.adminId, adminId)));
            },
            { isolationLevel: 'read committed' },
        );
    }

    /**
     * Every session of one account — sign-out-everywhere (FR-007). Deactivation
     * does the same inside `AdminRepository.updateAccess`, which already holds
     * the lock.
     */
    async deleteAllForAdmin(adminId: string): Promise<void> {
        await this.db.transaction(
            async tx => {
                await lockAdmin(tx, adminId);
                await tx.delete(adminRefreshTokens).where(eq(adminRefreshTokens.adminId, adminId));
            },
            { isolationLevel: 'read committed' },
        );
    }
}

/**
 * The lock every session write takes first. `FOR UPDATE` rather than a
 * weaker mode, so there is exactly one rule to remember: two writers of one
 * admin's sessions never overlap.
 */
async function lockAdmin(tx: DrizzleDB, adminId: string): Promise<AdminEntity | null> {
    const [row] = await tx.select().from(admins).where(eq(admins.id, adminId)).for('update');
    return row ? AdminEntity.from(row) : null;
}
