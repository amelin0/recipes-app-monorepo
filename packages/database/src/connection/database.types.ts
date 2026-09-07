import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '../schema';

export interface DatabaseConfig {
    url: string;
}

export type DrizzleDB = PostgresJsDatabase<typeof schema>;
