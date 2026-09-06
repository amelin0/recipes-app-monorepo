import { registerAs } from '@nestjs/config';

import { ThrottleKey, ThrottleRuleConfig, ThrottlerConfig } from './config.type';

const rule = (
    ttlEnv: string | undefined,
    limitEnv: string | undefined,
    ttl: number,
    limit: number,
): ThrottleRuleConfig => ({
    ttl: parseInt(ttlEnv ?? String(ttl), 10),
    limit: parseInt(limitEnv ?? String(limit), 10),
});

// Thresholds come from docs/adr/0003-*.md; env only overrides them.
export default registerAs<ThrottlerConfig>('throttler', () => ({
    global: rule(process.env.THROTTLE_TTL, process.env.THROTTLE_LIMIT, 60_000, 60),
    rules: {
        [ThrottleKey.Login]: rule(process.env.THROTTLE_LOGIN_TTL, process.env.THROTTLE_LOGIN_LIMIT, 900_000, 10),
        [ThrottleKey.RefreshToken]: rule(
            process.env.THROTTLE_REFRESH_TOKEN_TTL,
            process.env.THROTTLE_REFRESH_TOKEN_LIMIT,
            60_000,
            10,
        ),
        [ThrottleKey.FileUploadPresign]: rule(
            process.env.THROTTLE_FILE_UPLOAD_PRESIGN_TTL,
            process.env.THROTTLE_FILE_UPLOAD_PRESIGN_LIMIT,
            60_000,
            30,
        ),
    },
}));
