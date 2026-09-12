import { users } from '../schema';

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
     * session (session FR-007, password-reset FR-005).
     *
     * **The second-resolution edge.** `iat` counts WHOLE SECONDS, while
     * `sessions_valid_from` has sub-second precision, so for the one second a
     * revocation lands in the claim cannot say which side of it a token is on.
     * The comparison resolves that against the token: with a strict `<`, one
     * minted 300 ms *after* the revocation carries the same floored `iat` as
     * the second's start and is refused too. That costs its owner one extra
     * sign-in inside a one-second window. Rounding the other way would let a
     * token minted just *before* the revocation survive it — which is the bug
     * this exists to close, so the ambiguity is spent on the safe side.
     *
     * A missing `iat` fails closed for the same reason: every token we sign
     * carries one, so its absence is not owed the benefit of the doubt.
     */
    acceptsTokenIssuedAt(iatSeconds: number | undefined): boolean {
        if (this.sessionsValidFrom === null) return true;
        if (iatSeconds === undefined) return false;

        return iatSeconds * 1_000 >= this.sessionsValidFrom.getTime();
    }
}
