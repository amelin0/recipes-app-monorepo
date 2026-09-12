import { HttpService } from '@/shared/services';

import type {
    AuthTokens,
    CurrentUser,
    LoginPayload,
    OAuthSignInPayload,
    PasswordResetPermit,
    RegisterPayload,
    RequestPasswordResetPayload,
    ResendCodePayload,
    SetNewPasswordPayload,
    VerifyEmailPayload,
    VerifyPasswordResetPayload,
} from './auth.types';

/** Routes of the `auth` tag, relative to EXPO_PUBLIC_API_URL (…/api/v1). */
const ENDPOINTS = {
    login: '/auth/login',
    register: '/auth/register',
    verifyEmail: '/auth/verify-email',
    resendCode: '/auth/resend-code',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    oauth: '/auth/oauth',
    me: '/auth/me',
    passwordResetRequest: '/auth/password-reset/request',
    passwordResetVerify: '/auth/password-reset/verify',
    passwordResetComplete: '/auth/password-reset/complete',
} as const;

export const AuthApi = {
    /** 401 `auth.invalid-credentials`; 403 when the email is still unverified. */
    login: (payload: LoginPayload) => HttpService.post<AuthTokens>(ENDPOINTS.login, payload),

    /** 201 with no body — the code goes out by email. 409 `auth.email-taken`. */
    register: (payload: RegisterPayload) => HttpService.post<void>(ENDPOINTS.register, payload),

    /** Confirms the address AND issues the first session. */
    verifyEmail: (payload: VerifyEmailPayload) => HttpService.post<AuthTokens>(ENDPOINTS.verifyEmail, payload),

    /** Always 204 — never reveals whether the account exists. */
    resendCode: (payload: ResendCodePayload) => HttpService.post<void>(ENDPOINTS.resendCode, payload),

    /** Rotates the pair; the old refresh token is revoked. */
    refresh: (refreshToken: string) => HttpService.post<AuthTokens>(ENDPOINTS.refresh, { refreshToken }),

    logout: (refreshToken: string) => HttpService.post<void>(ENDPOINTS.logout, { refreshToken }),

    /** Ends every session of this account. */
    logoutAll: () => HttpService.post<void>(ENDPOINTS.logoutAll),

    oauth: (payload: OAuthSignInPayload) => HttpService.post<AuthTokens>(ENDPOINTS.oauth, payload),

    me: () => HttpService.get<CurrentUser>(ENDPOINTS.me),

    requestPasswordReset: (payload: RequestPasswordResetPayload) =>
        HttpService.post<void>(ENDPOINTS.passwordResetRequest, payload),

    /** Trades the emailed code for a permit token. */
    verifyPasswordReset: (payload: VerifyPasswordResetPayload) =>
        HttpService.post<PasswordResetPermit>(ENDPOINTS.passwordResetVerify, payload),

    /** Sets the password and revokes every existing session. */
    setNewPassword: (payload: SetNewPasswordPayload) =>
        HttpService.post<void>(ENDPOINTS.passwordResetComplete, payload),
};
