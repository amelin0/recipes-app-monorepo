import { sql } from 'drizzle-orm';

import { DrizzleDB } from '@dns/database';

/**
 * Wipes every auth table between tests. CASCADE plus the foreign keys means
 * truncating `users` alone would be enough, but naming all of them keeps this
 * honest when a table stops hanging off a user.
 */
export async function truncateAuthTables(db: DrizzleDB): Promise<void> {
    // `users` alone would be enough — every other table cascades from it —
    // but naming them keeps this honest if one ever stops hanging off a user.
    await db.execute(
        sql`TRUNCATE TABLE account_deletion_requests, user_reminders, user_settings, profiles,
            oauth_identities, password_reset_permits, otp_codes, refresh_tokens, users CASCADE`,
    );
}
