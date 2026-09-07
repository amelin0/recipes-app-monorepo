import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '../../.env' });

/**
 * Project-owned migration runner.
 *
 * Replaces `drizzle-kit migrate`, which hides the underlying Postgres error
 * behind a spinner when stdout is not a TTY — exactly the case in CI and on a
 * deploy box. This uses the same drizzle migrator and the same
 * `drizzle.__drizzle_migrations` ledger, but prints the full error so a failed
 * deploy is diagnosable from the log alone.
 */
async function main(): Promise<void> {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is not set (looked in ../../.env)');
    }

    // max: 1 — migrations must run sequentially on a single connection.
    const client = postgres(url, {
        max: 1,
        // The migrator issues CREATE SCHEMA / CREATE TABLE IF NOT EXISTS for
        // its own ledger, and Postgres answers with an "already exists,
        // skipping" NOTICE on every run but the first. Printing those buries
        // the real output of a runner whose whole purpose is a readable log.
        onnotice: notice => {
            if (notice.code === '42P06' || notice.code === '42P07') return;
            console.log(notice);
        },
    });
    const db = drizzle(client);

    try {
        console.log('[migrate] applying migrations from ./src/migrations ...');
        await migrate(db, { migrationsFolder: './src/migrations' });
        console.log('[migrate] done — all migrations applied');
    } finally {
        await client.end();
    }
}

// postgres-js hangs the PG error detail off these fields; print whatever exists.
const PG_ERROR_FIELDS = [
    'message',
    'severity',
    'code',
    'detail',
    'hint',
    'position',
    'where',
    'schema_name',
    'table_name',
    'column_name',
    'constraint_name',
    'query',
] as const;

function printError(error: unknown, label: string): void {
    const pgError = error as Record<string, unknown> | null;
    console.error(`  [${label}]`);
    let printedAny = false;

    for (const field of PG_ERROR_FIELDS) {
        const value = pgError?.[field];
        if (value === undefined || value === null || value === '') continue;

        // Trim a very long failing query so the real error stays readable.
        const text =
            typeof value === 'string' && value.length > 2000 ? `${value.slice(0, 2000)} …[truncated]` : String(value);
        console.error(`    ${field}: ${text}`);
        printedAny = true;
    }

    if (!printedAny && error instanceof Error) {
        console.error(`    ${error.stack ?? error.message}`);
    }
}

main().catch((error: unknown) => {
    console.error('\n[migrate] FAILED\n');

    // The real Postgres error usually sits on the cause chain: the migrator
    // wraps it in a generic "Failed query" error that says nothing on its own.
    let current: unknown = error;
    let depth = 0;
    while (current && depth < 5) {
        printError(current, depth === 0 ? 'error' : `cause #${depth}`);
        current = (current as { cause?: unknown })?.cause;
        depth++;
    }

    process.exit(1);
});
