import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { DynamicModule, Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Redis } from 'ioredis';

import { ResilientThrottlerStorage } from './resilient-throttler-storage';

const REDIS_CLIENT = Symbol('THROTTLER_REDIS_CLIENT');

export interface ThrottlerStorageModuleOptions {
    /** `redis://host:port`. Absent means «keep the counters in memory». */
    url?: string;
}

export interface ThrottlerStorageModuleAsyncOptions {
    imports?: DynamicModule['imports'];
    inject?: unknown[];
    useFactory: (...args: never[]) => Promise<ThrottlerStorageModuleOptions> | ThrottlerStorageModuleOptions;
}

/**
 * Where rate-limit counters live.
 *
 * Without this they live in the process, which means two things that only look
 * like details: they reset on every deploy, and with a second replica each one
 * counts to the limit separately — so «10 attempts a minute» quietly becomes
 * twenty. Redis is what makes the number mean what it says.
 *
 * **A missing URL is not an error.** Tests and a developer's machine run
 * without Redis, and forcing one there would make every suite depend on a
 * service none of them are about. In that case the throttler keeps its default
 * in-memory storage, exactly as before.
 */
@Global()
@Module({})
export class ThrottlerStorageModule implements OnApplicationShutdown {
    private static client: Redis | null = null;

    static forRootAsync(options: ThrottlerStorageModuleAsyncOptions): DynamicModule {
        return {
            module: ThrottlerStorageModule,
            imports: options.imports ?? [],
            providers: [
                {
                    provide: REDIS_CLIENT,
                    inject: (options.inject ?? []) as never[],
                    useFactory: async (...args: never[]): Promise<Redis | null> => {
                        const { url } = await options.useFactory(...args);
                        if (!url) return null;

                        const client = new Redis(url, {
                            // The API must start whether or not Redis is up: a
                            // rate limiter is not a reason to refuse boot.
                            lazyConnect: false,

                            // The offline queue is ON, and that is not the
                            // obvious choice — measured, not assumed. With it
                            // off, ioredis rejects every command issued before
                            // the connection is ready, so the first requests
                            // after boot and every reconnect would pass
                            // uncounted while Redis was perfectly healthy.
                            //
                            // The danger of queueing is a request that waits
                            // forever on a store that is gone, which is why the
                            // timeout below is the other half of this decision:
                            // a real outage costs 200 ms per request and then
                            // fails open, instead of hanging.
                            enableOfflineQueue: true,
                            commandTimeout: 200,
                            maxRetriesPerRequest: 1,
                        });

                        // Without a listener ioredis turns a connection error
                        // into an unhandled 'error' event, which crashes the
                        // process — the opposite of what fail-open is for.
                        client.on('error', () => undefined);

                        ThrottlerStorageModule.client = client;

                        return client;
                    },
                },
                {
                    provide: ThrottlerStorage,
                    inject: [REDIS_CLIENT],
                    useFactory: (client: Redis | null): ThrottlerStorage | undefined =>
                        client ? new ResilientThrottlerStorage(new ThrottlerStorageRedisService(client)) : undefined,
                },
            ],
            exports: [ThrottlerStorage],
        };
    }

    async onApplicationShutdown(): Promise<void> {
        await ThrottlerStorageModule.client?.quit().catch(() => undefined);
        ThrottlerStorageModule.client = null;
    }
}
