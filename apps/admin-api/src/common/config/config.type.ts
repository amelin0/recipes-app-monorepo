import type { ThrottleRuleConfig } from '@dns/api-common';
import type { DatabaseConfig } from '@dns/database';

export type { DatabaseConfig, ThrottleRuleConfig };

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
 * Named rate-limit rules for the staff surface. Far shorter than the client
 * list: an admin account is provisioned, never self-registered, so there is
 * no sign-up, no email code and no password-reset funnel to protect.
 */
export enum ThrottleKey {
    Login = 'login',
    RefreshToken = 'refresh-token',
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
    throttler: ThrottlerConfig;
}
