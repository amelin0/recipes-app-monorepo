import { Injectable } from '@nestjs/common';
import { and, eq, inArray, or } from 'drizzle-orm';

import { AdminRole } from '@dns/shared-types';

import { AdminEntity } from '../../entities';
import { adminRefreshTokens, admins } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertAdmin = typeof admins.$inferInsert;

/** What a SUPER_ADMIN may change about another account. Absent means «leave as is». */
export interface AdminAccessChange {
    role?: AdminRole;
    isActive?: boolean;
}

export type AdminAccessChangeResult =
    | { outcome: 'updated'; admin: AdminEntity }
    | { outcome: 'not-found' }
    /** The change would leave no active SUPER_ADMIN. */
    | { outcome: 'last-super-admin' }
    /** The actor is no longer an active SUPER_ADMIN by the time the rows are locked. */
    | { outcome: 'actor-not-allowed' };

const isActiveSuperAdmin = (row: { role: AdminRole; isActive: boolean }): boolean =>
    row.role === AdminRole.SuperAdmin && row.isActive;

@Injectable()
export class AdminRepository extends BaseRepository {
    /**
     * Looks up by address for sign-in.
     *
     * ⚠️ The caller must lower-case first. The unique index is on the raw
     * column, so the whole scheme rests on the service normalising — this
     * method does not do it, because doing it here and there both would hide
     * which layer owns the rule.
     */
    async findByEmail(email: string): Promise<AdminEntity | null> {
        const row = await this.db.query.admins.findFirst({ where: eq(admins.email, email) });
        return row ? AdminEntity.from(row) : null;
    }

    async findById(id: string): Promise<AdminEntity | null> {
        const row = await this.db.query.admins.findFirst({ where: eq(admins.id, id) });
        return row ? AdminEntity.from(row) : null;
    }

    async create(data: InsertAdmin): Promise<AdminEntity> {
        const [row] = await this.db.insert(admins).values(data).returning();
        if (!row) throw new Error('Failed to insert admin');
        return AdminEntity.from(row);
    }

    /**
     * Records a successful sign-in. Deliberately not awaited on the login path
     * by the caller's critical section: it is a convenience column, and a slow
     * write here should not slow down the answer.
     */
    async touchLastLogin(id: string): Promise<void> {
        await this.db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, id));
    }

    /**
     * Changes a staff account's role and/or active state (sign-in FR-008,
     * FR-011) — the only way either changes.
     *
     * One transaction that first locks, `FOR UPDATE` and in id order, every
     * active SUPER_ADMIN plus the target and the actor. Everything after is
     * decided from those locked rows, which no one else can change until this
     * commits:
     *
     * - **at least one other active SUPER_ADMIN must remain** if the target is
     *   one and stops being one. Two SUPER_ADMINs demoting — or deactivating —
     *   each other at the same moment used to both pass (each saw the other
     *   still in charge) and leave nobody able to manage staff. Now the second
     *   waits for the first and finds itself the last;
     * - **the actor must still be an active SUPER_ADMIN.** The guard read their
     *   role when the request arrived; a demotion that committed since then
     *   must not let the request finish on authority it no longer carries.
     *   `actorId: null` is the system path (seed, tests) and skips only this.
     *
     * Deactivation also deletes the account's refresh tokens here, under the
     * lock every session write takes (see `AdminRefreshTokenRepository`): a
     * refresh either committed its successor first — and this `DELETE`, a
     * later statement, sees it — or waits and finds the account closed.
     *
     * Id order is what keeps two of these from deadlocking on each other;
     * every other admin-row lock in the codebase takes a single row.
     * READ COMMITTED on purpose: the locked set is re-read at its latest
     * committed version as each lock is granted, which is exactly the state
     * the decision needs; SERIALIZABLE would only add `40001` retries.
     */
    async updateAccess(
        targetId: string,
        change: AdminAccessChange,
        actorId: string | null,
    ): Promise<AdminAccessChangeResult> {
        return this.db.transaction(
            async (tx): Promise<AdminAccessChangeResult> => {
                const locked = await tx
                    .select()
                    .from(admins)
                    .where(
                        or(
                            and(eq(admins.role, AdminRole.SuperAdmin), eq(admins.isActive, true)),
                            inArray(admins.id, actorId === null ? [targetId] : [targetId, actorId]),
                        ),
                    )
                    .orderBy(admins.id)
                    .for('update');

                const target = locked.find(row => row.id === targetId);
                if (!target) return { outcome: 'not-found' };

                const nextRole = change.role ?? target.role;
                const nextActive = change.isActive ?? target.isActive;

                if (isActiveSuperAdmin(target) && !isActiveSuperAdmin({ role: nextRole, isActive: nextActive })) {
                    const others = locked.filter(row => row.id !== targetId && isActiveSuperAdmin(row));
                    if (others.length === 0) return { outcome: 'last-super-admin' };
                }

                if (actorId !== null) {
                    const actor = locked.find(row => row.id === actorId);
                    if (!actor || !isActiveSuperAdmin(actor)) return { outcome: 'actor-not-allowed' };
                }

                const [row] = await tx
                    .update(admins)
                    .set({ role: nextRole, isActive: nextActive, updatedAt: new Date() })
                    .where(eq(admins.id, targetId))
                    .returning();
                if (!row) throw new Error(`Admin ${targetId} vanished while locked`);

                if (!nextActive) {
                    await tx.delete(adminRefreshTokens).where(eq(adminRefreshTokens.adminId, targetId));
                }

                return { outcome: 'updated', admin: AdminEntity.from(row) };
            },
            { isolationLevel: 'read committed' },
        );
    }

    /** Every staff account, oldest first — the SUPER_ADMIN's list. */
    async findAll(): Promise<AdminEntity[]> {
        const rows = await this.db.select().from(admins).orderBy(admins.createdAt);
        return rows.map(AdminEntity.from);
    }

    /** Counts what exists, so the seed can tell "empty environment" from "already provisioned". */
    async countByRole(role: AdminRole): Promise<number> {
        const rows = await this.db.select({ id: admins.id }).from(admins).where(eq(admins.role, role));
        return rows.length;
    }
}
