import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { seedRecipes } from './recipes.seed';

config({ path: '../../.env' });

/**
 * Seed entry point behind `pnpm db:seed`.
 *
 * Seeds hold **development scaffolding**, migrations hold the product. The
 * dictionaries — categories, cuisines, diets, the fifteen quick-pick products,
 * the FAQ, the subscription plans — ship as migrations because the app is
 * wrong without them. What lives here is the opposite: rows that exist only so
 * a fresh environment is not empty, and that will be deleted the day the admin
 * panel's recipe import replaces them.
 *
 * Every seed is idempotent — running this twice changes nothing the second
 * time — so it is safe on an environment that already has data.
 */
async function main(): Promise<void> {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is not set (looked in ../../.env)');
    }

    const client = postgres(url, { max: 1 });
    const db = drizzle(client);

    try {
        await seedRecipes(db);
        console.log('[seed] done');
    } finally {
        await client.end();
    }
}

main().catch((error: unknown) => {
    console.error('[seed] FAILED');
    console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    process.exit(1);
});
