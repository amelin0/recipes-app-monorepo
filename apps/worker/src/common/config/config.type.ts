import type { DatabaseConfig } from '@dns/database';

export type { DatabaseConfig };

export interface WorkerAppConfig {
    env: string;
    /** Serves /health and /metrics only — the worker answers no business routes. */
    port: number;
}

export interface RedisConfig {
    url: string;
}

export interface JobsConfig {
    /** Cron for the nightly sweep of expired rows. */
    cleanupCron: string;
    /** Cron for the subscription date sweep. */
    subscriptionCron: string;
    /** How many days ahead «your premium is running out» is worth saying. */
    expiringWithinDays: number;
}

export interface AllConfig {
    app: WorkerAppConfig;
    database: DatabaseConfig;
    redis: RedisConfig;
    jobs: JobsConfig;
}
