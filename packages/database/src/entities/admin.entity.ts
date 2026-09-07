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
}
