import { registerAs } from '@nestjs/config';

import { RedisConfig } from './config.type';

/**
 * Only the rate limiter reads this today.
 *
 * Optional on purpose: a developer machine and every test suite run without
 * Redis, and requiring it would make them depend on a service none of them are
 * about. Empty falls back to in-process counters.
 */
export default registerAs<RedisConfig>('redis', () => ({
    url: process.env.REDIS_URL ?? '',
}));
