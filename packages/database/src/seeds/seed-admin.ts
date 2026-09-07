import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { seedAdmin } from './admin.seed';

config({ path: '../../.env' });

/**
 * Entry point behind `pnpm db:seed:admin`.
 *
 * Separate from `seed.ts` on purpose. That one is development scaffolding and
 * is safe to run anywhere; this one creates a credential and is a deliberate
 * deployment step, run once per environment. Folding them together would make
 * `db:seed` something you have to think about before running.
 */
async function main(): Promise<void> {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is not set (looked in ../../.env)');
    }

    const client = postgres(url, { max: 1 });
    const db = drizzle(client);

    try {
        await seedAdmin(db);
    } finally {
        await client.end();
    }
}

main().catch((error: unknown) => {
    console.error('[seed:admin] FAILED');
    console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    process.exit(1);
});
