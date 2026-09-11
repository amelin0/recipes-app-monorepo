import { adminRefreshTokens } from '../schema';

type AdminRefreshTokenRow = typeof adminRefreshTokens.$inferSelect;

/**
 * A stored refresh token as the service reads it before deciding anything.
 *
 * Deliberately carries no «is it spent / is it inside the grace window»
 * helpers: those answers are only true at the moment they are read, and the
 * rotation decides them inside its own locked transaction
 * (`AdminRefreshTokenRepository.rotate`), not from a copy taken earlier.
 */
export class AdminRefreshTokenEntity {
    readonly id: string;
    readonly adminId: string;
    readonly familyId: string;
    readonly tokenHash: string;
    readonly expiresAt: Date;
    readonly rotatedAt: Date | null;
    readonly graceUsedAt: Date | null;
    readonly createdAt: Date;

    private constructor(row: AdminRefreshTokenRow) {
        this.id = row.id;
        this.adminId = row.adminId;
        this.familyId = row.familyId;
        this.tokenHash = row.tokenHash;
        this.expiresAt = row.expiresAt;
        this.rotatedAt = row.rotatedAt;
        this.graceUsedAt = row.graceUsedAt;
        this.createdAt = row.createdAt;
    }

    static from(row: AdminRefreshTokenRow): AdminRefreshTokenEntity {
        return new AdminRefreshTokenEntity(row);
    }
}
