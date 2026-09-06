import type { Config } from 'jest';

/**
 * The real-Postgres suite. Kept apart from `pnpm typecheck` / `pnpm lint` on
 * purpose: those must stay runnable from a clean checkout, and the moment
 * they need a database they stop being. Run it deliberately with
 * `pnpm test:db` after `docker compose up -d`.
 *
 * ts-jest rather than tsx: NestJS resolves constructor dependencies from
 * `design:paramtypes`, which only a TypeScript emit with
 * `emitDecoratorMetadata` produces. esbuild-based runners drop it and every
 * provider fails to instantiate.
 */
const config: Config = {
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: 'test/.*\.db-spec\.ts$',
    moduleFileExtensions: ['ts', 'js', 'json'],
    setupFiles: ['reflect-metadata'],
    // The suites share one database and truncate between tests, so they
    // cannot run side by side.
    maxWorkers: 1,
    // Booting a Nest context plus bcrypt work is seconds, not milliseconds;
    // the 5s default turns a slow machine into a flake.
    testTimeout: 60_000,
    transform: {
        '^.+\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    },
    moduleNameMapper: {
        // Sub-path exports first: `@dns/api-infrastructure/otp` is a real
        // export map entry, and the catch-all below would resolve it to a
        // directory that does not exist.
        '^@dns/api-infrastructure/(.*)$': '<rootDir>/../../packages/api-infrastructure/src/$1',
        '^@dns/(.*)$': '<rootDir>/../../packages/$1/src',
    },
};

export default config;
