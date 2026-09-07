import { UnauthorizedException } from '@nestjs/common';

/** Stable machine-readable reasons travelling in `ApiError.code`. */
export const AdminAuthErrorCode = {
    InvalidCredentials: 'admin-auth.invalid-credentials',
    InvalidRefreshToken: 'admin-auth.invalid-refresh-token',
    Forbidden: 'admin-auth.forbidden',
} as const;

export type AdminAuthErrorCode = (typeof AdminAuthErrorCode)[keyof typeof AdminAuthErrorCode];

/**
 * The single answer to every way a sign-in can fail: no such address, wrong
 * password, deactivated account, or an address that belongs to an app user
 * rather than a staff member (sign-in FR-003, FR-004).
 *
 * Four causes, one message and one code. Distinguishing them would turn the
 * login form into a directory of who works here — and «account deactivated»
 * in particular tells an attacker they found a real address.
 */
export const invalidCredentialsException = (): UnauthorizedException =>
    new UnauthorizedException({
        message: 'Invalid email or password',
        code: AdminAuthErrorCode.InvalidCredentials,
    });

export const invalidRefreshTokenException = (): UnauthorizedException =>
    new UnauthorizedException({
        message: 'Invalid refresh token',
        code: AdminAuthErrorCode.InvalidRefreshToken,
    });
