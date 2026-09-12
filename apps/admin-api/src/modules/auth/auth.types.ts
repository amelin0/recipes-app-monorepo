/**
 * Claims we mint. `type` is not decoration: a refresh token is also a signed
 * JWT with a `sub`, and without discriminating on this field one would open a
 * session at any Bearer-guarded route.
 */
export interface AdminAccessTokenPayload {
    sub: string;
    email: string;
    role: string;
    type: 'access';
    /**
     * Seconds since the epoch, stamped by the signer — absent from the object
     * handed to `sign`, present on every payload that comes back from
     * `verify`. `AdminJwtStrategy` reads it to enforce
     * `admins.sessions_valid_from`, so signing out everywhere ends this token
     * instead of letting it run out its fifteen minutes.
     */
    iat?: number;
}

export interface AdminRefreshTokenPayload {
    sub: string;
    /** The refresh-token row id, so a refresh is one indexed read. */
    jti: string;
    type: 'refresh';
}

/** What the login route knows about the caller, for the journal (FR-009). */
export interface AttemptContext {
    ip: string | null;
    userAgent: string | null;
}
