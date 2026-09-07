import type { ThrottleRuleConfig } from '@dns/api-common';
import type { EmailConfig } from '@dns/api-infrastructure/email';
import type { OAuthConfig } from '@dns/api-infrastructure/oauth';
import type { OtpConfig } from '@dns/api-infrastructure/otp';
import type { PurchasesConfig } from '@dns/api-infrastructure/purchases';
import type { StorageConfig } from '@dns/api-infrastructure/storage';
import type { DatabaseConfig } from '@dns/database';

export type { DatabaseConfig, EmailConfig, OAuthConfig, OtpConfig, PurchasesConfig, StorageConfig, ThrottleRuleConfig };

export enum AppEnv {
    Dev = 'development',
    Stage = 'stage',
    Prod = 'production',
}

export interface AppConfig {
    env: AppEnv;
    port: number;
}

export interface AuthConfig {
    access: {
        secret: string;
        expiresIn: string;
    };
    refresh: {
        secret: string;
        expiresIn: string;
    };
}

/**
 * Named rate-limit rules. A route opts in with
 * `@SetThrottleKey(ThrottleKey.Login)`; everything else falls back to the
 * global default.
 */
export enum ThrottleKey {
    Login = 'login',
    Register = 'register',
    RefreshToken = 'refresh-token',
    SendOtp = 'send-otp',
    VerifyOtp = 'verify-otp',
    PasswordReset = 'password-reset',
    OauthGoogle = 'oauth-google',
    OauthApple = 'oauth-apple',
    FileUploadPresign = 'file-upload-presign',
}

export interface ThrottlerConfig {
    global: ThrottleRuleConfig;
    rules: Record<ThrottleKey, ThrottleRuleConfig>;
}

export interface AllConfig {
    app: AppConfig;
    auth: AuthConfig;
    database: DatabaseConfig;
    email: EmailConfig;
    oauth: OAuthConfig;
    otp: OtpConfig;
    purchases: PurchasesConfig;
    storage: StorageConfig;
    throttler: ThrottlerConfig;
}
