import { DynamicModule, InjectionToken, Module, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../schema';

import { DATABASE_CONNECTION } from './database.tokens';
import { DatabaseConfig } from './database.types';

export interface DatabaseConnectionAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => DatabaseConfig | Promise<DatabaseConfig>;
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
                    provide: DATABASE_CONNECTION,
                    useFactory: async (...args: never[]) => {
                        const cfg = await options.useFactory(...args);
                        const client = postgres(cfg.url);
                        return drizzle(client, { schema });
                    },
                    inject: options.inject ?? [],
                },
            ],
            exports: [DATABASE_CONNECTION],
        };
    }
}
