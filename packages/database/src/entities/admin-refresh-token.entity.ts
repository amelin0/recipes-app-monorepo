import { adminRefreshTokens } from '../schema';

type AdminRefreshTokenRow = typeof adminRefreshTokens.$inferSelect;

export class AdminRefreshTokenEntity {
    readonly id: string;
    readonly adminId: string;
    readonly familyId: string;
    readonly tokenHash: string;
    readonly expiresAt: Date;
    readonly rotatedAt: Date | null;
    readonly createdAt: Date;

    private constructor(row: AdminRefreshTokenRow) {
        this.id = row.id;
        this.adminId = row.adminId;
        this.familyId = row.familyId;
        this.tokenHash = row.tokenHash;
        this.expiresAt = row.expiresAt;
        this.rotatedAt = row.rotatedAt;
        this.createdAt = row.createdAt;
    }

    static from(row: AdminRefreshTokenRow): AdminRefreshTokenEntity {
        return new AdminRefreshTokenEntity(row);
    }

    isExpired(now: Date = new Date()): boolean {
        return this.expiresAt <= now;
    }

    /** True once the token has been exchanged. Presenting it again is a replay. */
    isRotated(): boolean {
        return this.rotatedAt !== null;
    }

    /**
     * A just-spent token, still inside the grace window.
     *
     * Two browser tabs refresh at the same moment: both hold the same valid
     * token, one wins, and without this the loser's presentation looks exactly
     * like theft and revokes the chain — signing the admin out mid-edit. The
     * window is short enough that a stolen token is not usefully replayable.
     */
    isWithinRotationGrace(graceMs: number, now: Date = new Date()): boolean {
        if (this.rotatedAt === null) return false;
        return now.getTime() - this.rotatedAt.getTime() <= graceMs;
    }
}
