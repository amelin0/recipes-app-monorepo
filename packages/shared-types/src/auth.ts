/** Identity providers a user can sign in with alongside email + password. */
export enum OAuthProvider {
    Apple = 'apple',
    Google = 'google',
}

/**
 * Why a one-time code was issued. The two flows share one entity — a 6-digit
 * code with an expiry and an attempt counter — and differ only in what
 * consuming it grants.
 */
export enum OtpPurpose {
    EmailVerification = 'email_verification',
    PasswordReset = 'password_reset',
}

/** The token pair handed out on every successful authentication. */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
