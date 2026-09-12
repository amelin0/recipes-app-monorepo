import { AdminRole } from '@dns/shared-types';

import { admins } from '../schema';

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
     * session — the staff mirror of `UserEntity.acceptsTokenIssuedAt`, and the
     * reason «sign out everywhere» ends a session now rather than within
     * fifteen minutes (sign-in FR-007).
     *
     * `iat` counts WHOLE SECONDS and the marker does not, so the second a
     * revocation lands in is ambiguous. Resolved against the token: a strict
     * `<` refuses one minted moments after the revocation as well, costing an
     * extra sign-in inside a one-second window rather than letting a token
     * minted just before it survive.
     */
    acceptsTokenIssuedAt(iatSeconds: number | undefined): boolean {
        if (this.sessionsValidFrom === null) return true;
        if (iatSeconds === undefined) return false;

        return iatSeconds * 1_000 >= this.sessionsValidFrom.getTime();
    }
}
