import { BadRequestException } from '@nestjs/common';

/**
 * Stable machine-readable reasons travelling in `ApiError.code`.
 *
 * The mobile app branches on these, never on the message: a 400 from a wrong
 * code and a 400 from an expired one look identical otherwise, and the screens
 * need to say different things.
 */
export const AuthErrorCode = {
    EmailTaken: 'auth.email-taken',
    InvalidCredentials: 'auth.invalid-credentials',
    EmailNotVerified: 'auth.email-not-verified',
    /**
     * Reached only after the credentials already checked out, so naming the
     * reason tells nobody anything they had not already proven. Hiding it
     * behind «invalid credentials» would send the owner round the password
     * reset loop for something a reset cannot fix.
     */
    AccountBlocked: 'auth.account-blocked',
    InvalidCode: 'auth.invalid-code',
    InvalidRefreshToken: 'auth.invalid-refresh-token',
    InvalidPermit: 'auth.invalid-permit',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * One exception for every way a code can fail — wrong, expired, already spent,
 * out of attempts, or issued to an address that has no account. Distinguishing
 * them would tell a caller which codes exist.
 */
export const invalidCodeException = (): BadRequestException =>
    new BadRequestException({
        message: 'Invalid or expired code',
        code: AuthErrorCode.InvalidCode,
    });
