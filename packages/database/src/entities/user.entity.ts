import { users } from '../schema';

import { accessTokenIssuedAt, tokenIssuedAtIsAccepted } from './session-marker';

type UserRow = typeof users.$inferSelect;

export class UserEntity {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string | null;
    readonly emailVerifiedAt: Date | null;
    readonly blockedAt: Date | null;
    readonly sessionsValidFrom: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(row: UserRow) {
        this.id = row.id;
        this.email = row.email;
        this.passwordHash = row.passwordHash;
        this.emailVerifiedAt = row.emailVerifiedAt;
        this.blockedAt = row.blockedAt;
        this.sessionsValidFrom = row.sessionsValidFrom;
        this.createdAt = row.createdAt;
        this.updatedAt = row.updatedAt;
    }

    static from(row: UserRow): UserEntity {
        return new UserEntity(row);
    }

    isEmailVerified(): boolean {
        return this.emailVerifiedAt !== null;
    }

    /**
     * Staff stopped this account. Checked wherever a session is handed out and
     * on every authenticated request — an account that is blocked mid-session
     * must not keep working for the rest of its token's fifteen minutes.
     */
    isBlocked(): boolean {
        return this.blockedAt !== null;
    }

    /**
     * False for an account created through Apple or Google that has never set
     * one. Such an account cannot log in with a password — but it can acquire
     * one through the reset flow (sign-up FR-013).
     */
    hasPassword(): boolean {
        return this.passwordHash !== null;
    }

    /**
     * Whether an access token stamped with this `iat` still belongs to a live
     * session (session FR-007, password-reset FR-005). Strict about the second
     * a revocation lands in — see `session-marker.ts`.
     */
    acceptsTokenIssuedAt(iatSeconds: number | undefined): boolean {
        return tokenIssuedAtIsAccepted(this.sessionsValidFrom, iatSeconds);
    }

    /**
     * The `iat` an access token minted now must carry to be accepted — past
     * the marker even when it was set earlier in this same second.
     */
    accessTokenIssuedAt(nowMs: number = Date.now()): number {
        return accessTokenIssuedAt(this.sessionsValidFrom, nowMs);
    }
}
