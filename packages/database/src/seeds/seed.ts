/**
 * Seed entry point behind `pnpm db:seed`.
 *
 * Seeds are added domain by domain (languages and the USDA product catalogue
 * first). Until then this exits cleanly rather than letting the root script
 * fail with a missing-file error.
 */
async function main(): Promise<void> {
    console.log('[seed] nothing to seed yet');
}

main().catch((error: unknown) => {
    console.error('[seed] FAILED', error);
    process.exit(1);
});
