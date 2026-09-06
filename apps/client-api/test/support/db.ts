import { sql } from 'drizzle-orm';

import { DrizzleDB } from '@dns/database';

/**
 * Wipes every auth table between tests. CASCADE plus the foreign keys means
 * truncating `users` alone would be enough, but naming all of them keeps this
 * honest when a table stops hanging off a user.
 */
export async function truncateAuthTables(db: DrizzleDB): Promise<void> {
    await db.execute(
        sql`TRUNCATE TABLE oauth_identities, password_reset_permits, otp_codes, refresh_tokens, users CASCADE`,
    );
}
