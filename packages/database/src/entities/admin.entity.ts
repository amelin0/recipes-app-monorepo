import { AdminRole } from '@dns/shared-types';

import { admins } from '../schema';

import { accessTokenIssuedAt, tokenIssuedAtIsAccepted } from './session-marker';

type AdminRow = typeof admins.$inferSelect;

export class AdminEntity {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly fullName: string;
    readonly role: AdminRole;
    readonly isActive: boolean;
    readonly sessionsValidFrom: Date | null;
    readonly lastLoginAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(row: AdminRow) {
        this.id = row.id;
        this.email = row.email;
        this.passwordHash = row.passwordHash;
        this.fullName = row.fullName;
        this.role = row.role;
        this.isActive = row.isActive;
        this.sessionsValidFrom = row.sessionsValidFrom;
        this.lastLoginAt = row.lastLoginAt;
        this.createdAt = row.createdAt;
        this.updatedAt = row.updatedAt;
    }

    static from(row: AdminRow): AdminEntity {
        return new AdminEntity(row);
    }

    /** Only a SUPER_ADMIN provisions and deactivates other accounts (sign-in FR-011). */
    isSuperAdmin(): boolean {
        return this.role === AdminRole.SuperAdmin;
    }

    /**
     * Whether this account may hold a session at all. Checked on login *and*
     * on every authenticated request — a deactivated admin must lose access
     * now, not when their access token expires (sign-in FR-008).
     */
    canSignIn(): boolean {
        return this.isActive;
    }

    /**
     * Whether an access token stamped with this `iat` still belongs to a live
     * session — the reason «sign out everywhere» ends a session now rather than
     * within fifteen minutes (sign-in FR-007). See `session-marker.ts`.
     */
    acceptsTokenIssuedAt(iatSeconds: number | undefined): boolean {
        return tokenIssuedAtIsAccepted(this.sessionsValidFrom, iatSeconds);
    }

    /** The `iat` an access token minted now must carry to be accepted. */
    accessTokenIssuedAt(nowMs: number = Date.now()): number {
        return accessTokenIssuedAt(this.sessionsValidFrom, nowMs);
    }
}
