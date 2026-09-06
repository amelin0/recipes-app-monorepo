import {
    DynamicModule,
    Inject,
    Injectable,
    InjectionToken,
    Module,
    ModuleMetadata,
    OnModuleDestroy,
    OptionalFactoryDependency,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';

import * as schema from '../schema';

import { DATABASE_CLIENT, DATABASE_CONNECTION } from './database.tokens';
import { DatabaseConfig } from './database.types';

export interface DatabaseConnectionAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => DatabaseConfig | Promise<DatabaseConfig>;
}

/**
 * Ends the connection pool when the module goes down.
 *
 * The drizzle handle is a plain object, so Nest has no hook to call on it —
 * this provider exists to own the postgres client's lifecycle. Without it the
 * pool outlives the application: a test run never exits, and a container
 * ignores SIGTERM until it is killed.
 */
@Injectable()
class DatabaseLifecycle implements OnModuleDestroy {
    constructor(@Inject(DATABASE_CLIENT) private readonly client: Sql) {}

    async onModuleDestroy(): Promise<void> {
        await this.client.end();
    }
}

/**
 * Global provider of the single Drizzle handle.
 *
 * Registered by both APIs (`client-api`, `admin-api`) against the same
 * database; each process owns its own pool.
 */
@Module({})
export class DatabaseConnectionModule {
    static forRootAsync(options: DatabaseConnectionAsyncOptions): DynamicModule {
        return {
            module: DatabaseConnectionModule,
            global: true,
            imports: options.imports,
            providers: [
                {
                    provide: DATABASE_CLIENT,
                    useFactory: async (...args: never[]) => {
                        const cfg = await options.useFactory(...args);
                        return postgres(cfg.url);
                    },
                    inject: options.inject ?? [],
                },
                {
                    provide: DATABASE_CONNECTION,
                    useFactory: (client: Sql) => drizzle(client, { schema }),
                    inject: [DATABASE_CLIENT],
                },
                DatabaseLifecycle,
            ],
            exports: [DATABASE_CONNECTION, DATABASE_CLIENT],
        };
    }
}
