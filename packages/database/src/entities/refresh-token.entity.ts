import { refreshTokens } from '../schema';

type RefreshTokenRow = typeof refreshTokens.$inferSelect;

export class RefreshTokenEntity {
    readonly id: string;
    readonly userId: string;
    readonly familyId: string;
    readonly tokenHash: string;
    readonly expiresAt: Date;
    readonly rotatedAt: Date | null;
    readonly graceUsedAt: Date | null;
    readonly createdAt: Date;

    private constructor(row: RefreshTokenRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.familyId = row.familyId;
        this.tokenHash = row.tokenHash;
        this.expiresAt = row.expiresAt;
        this.rotatedAt = row.rotatedAt;
        this.graceUsedAt = row.graceUsedAt;
        this.createdAt = row.createdAt;
    }

    static from(row: RefreshTokenRow): RefreshTokenEntity {
        return new RefreshTokenEntity(row);
    }

    isExpired(now: Date = new Date()): boolean {
        return this.expiresAt <= now;
    }

    /** True once the token has been exchanged. Presenting it again is a replay. */
    isRotated(): boolean {
        return this.rotatedAt !== null;
    }
}
