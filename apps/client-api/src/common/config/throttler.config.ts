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
        [ThrottleKey.Register]: rule(
            process.env.THROTTLE_REGISTER_TTL,
            process.env.THROTTLE_REGISTER_LIMIT,
            3_600_000,
            5,
        ),
        [ThrottleKey.RefreshToken]: rule(
            process.env.THROTTLE_REFRESH_TOKEN_TTL,
            process.env.THROTTLE_REFRESH_TOKEN_LIMIT,
            60_000,
            10,
        ),
        [ThrottleKey.SendOtp]: rule(
            process.env.THROTTLE_SEND_OTP_TTL,
            process.env.THROTTLE_SEND_OTP_LIMIT,
            3_600_000,
            5,
        ),
        [ThrottleKey.VerifyOtp]: rule(
            process.env.THROTTLE_VERIFY_OTP_TTL,
            process.env.THROTTLE_VERIFY_OTP_LIMIT,
            900_000,
            10,
        ),
        [ThrottleKey.PasswordReset]: rule(
            process.env.THROTTLE_PASSWORD_RESET_TTL,
            process.env.THROTTLE_PASSWORD_RESET_LIMIT,
            3_600_000,
            5,
        ),
        [ThrottleKey.OauthGoogle]: rule(
            process.env.THROTTLE_OAUTH_GOOGLE_TTL,
            process.env.THROTTLE_OAUTH_GOOGLE_LIMIT,
            60_000,
            5,
        ),
        [ThrottleKey.OauthApple]: rule(
            process.env.THROTTLE_OAUTH_APPLE_TTL,
            process.env.THROTTLE_OAUTH_APPLE_LIMIT,
            60_000,
            5,
        ),
        [ThrottleKey.FileUploadPresign]: rule(
            process.env.THROTTLE_FILE_UPLOAD_PRESIGN_TTL,
            process.env.THROTTLE_FILE_UPLOAD_PRESIGN_LIMIT,
            60_000,
            30,
        ),
    },
}));
