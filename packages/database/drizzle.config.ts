import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Env lives at the monorepo root, not next to this package.
config({ path: '../../.env' });

export default defineConfig({
    schema: './src/schema/index.ts',
    out: './src/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
