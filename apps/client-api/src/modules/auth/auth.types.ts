/** Claims carried by an access token. */
export interface AccessTokenPayload {
    sub: string;
    email: string;
}

/**
 * Claims carried by a refresh token. `jti` is the `refresh_tokens` row id, so
 * a refresh costs one indexed read; `type` stops an access token from being
 * replayed here even if the two were ever signed with the same secret.
 */
export interface RefreshTokenPayload {
    sub: string;
    jti: string;
    type: 'refresh';
}

/** Claims carried by the one-shot permit issued after a reset code checks out. */
export interface PasswordResetPermitPayload {
    sub: string;
    jti: string;
    type: 'password-reset';
}
