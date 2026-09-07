/**
 * Every token this module signs carries an explicit `type`, and every place
 * that accepts one checks it.
 *
 * Without that claim the tokens are distinguishable only by which secret
 * signed them, and any two flows sharing a secret become interchangeable —
 * a password-reset permit would satisfy `JwtStrategy` and hand its bearer a
 * session, which password-reset FR-009 exists to prevent.
 */
export type TokenType = 'access' | 'refresh' | 'password-reset';

export interface AccessTokenPayload {
    sub: string;
    email: string;
    type: 'access';
}

/** `jti` is the `refresh_tokens` row id, so a refresh costs one indexed read. */
export interface RefreshTokenPayload {
    sub: string;
    jti: string;
    type: 'refresh';
}

/** `jti` is the `password_reset_permits` row id — the record that makes it single-use. */
export interface PasswordResetPermitPayload {
    sub: string;
    jti: string;
    type: 'password-reset';
}
