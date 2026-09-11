import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { AdminRole } from '@dns/shared-types';

import { AdminEntity } from '../../entities';
import { adminRefreshTokens, admins } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertAdmin = typeof admins.$inferInsert;

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
     * The revocation switch (sign-in FR-008): the flag and, when it closes,
     * every refresh token of the account — one transaction, under the same
     * row lock every session write takes (see `AdminRefreshTokenRepository`).
     *
     * As two autocommits the order was the whole defence, and it was not
     * enough: a refresh already past its `is_active` check could insert its
     * successor after the tokens were deleted. Under the lock the refresh
     * either commits first — and this `DELETE` sees its successor — or waits
     * and finds the account closed.
     */
    async setActive(id: string, isActive: boolean): Promise<void> {
        await this.db.transaction(
            async tx => {
                await tx.select({ id: admins.id }).from(admins).where(eq(admins.id, id)).for('update');
                await tx.update(admins).set({ isActive, updatedAt: new Date() }).where(eq(admins.id, id));

                if (!isActive) {
                    await tx.delete(adminRefreshTokens).where(eq(adminRefreshTokens.adminId, id));
                }
            },
            { isolationLevel: 'read committed' },
        );
    }

    /** Every staff account, oldest first — the SUPER_ADMIN's list. */
    async findAll(): Promise<AdminEntity[]> {
        const rows = await this.db.select().from(admins).orderBy(admins.createdAt);
        return rows.map(AdminEntity.from);
    }

    async setRole(id: string, role: AdminRole): Promise<void> {
        await this.db.update(admins).set({ role, updatedAt: new Date() }).where(eq(admins.id, id));
    }

    /** Counts what exists, so the seed can tell "empty environment" from "already provisioned". */
    async countByRole(role: AdminRole): Promise<number> {
        const rows = await this.db.select({ id: admins.id }).from(admins).where(eq(admins.role, role));
        return rows.length;
    }
}
