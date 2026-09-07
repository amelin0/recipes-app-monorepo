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
