import type { ThrottleRuleConfig } from '@dns/api-common';
import type { StorageConfig } from '@dns/api-infrastructure/storage';
import type { DatabaseConfig } from '@dns/database';

export type { DatabaseConfig, StorageConfig, ThrottleRuleConfig };

export interface RedisConfig {
    /** Empty means «keep rate-limit counters in this process» — see ThrottlerStorageModule. */
    url: string;
}

export enum AppEnv {
    Dev = 'development',
    Stage = 'stage',
    Prod = 'production',
}

export interface AppConfig {
    env: AppEnv;
    port: number;
    /** Maximum rows accepted in one recipe CSV import. */
    importMaxRows: number;
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
    redis: RedisConfig;
    storage: StorageConfig;
    throttler: ThrottlerConfig;
}
