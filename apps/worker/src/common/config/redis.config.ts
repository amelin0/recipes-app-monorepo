import { registerAs } from '@nestjs/config';

import { RedisConfig } from './config.type';

/**
 * The queue's backing store (ADR-0008).
 *
 * Required rather than defaulted in production: a worker that silently
 * connects to localhost would look healthy and run nothing.
 */
export default registerAs<RedisConfig>('redis', () => ({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
}));
