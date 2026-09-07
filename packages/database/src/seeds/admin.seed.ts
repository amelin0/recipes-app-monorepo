import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { hash } from 'bcryptjs';

import { ADMIN_AUTH_POLICY } from '@dns/constants';
import { AdminRole } from '@dns/shared-types';

import { admins } from '../schema/admins.schema';

/**
 * Provisions the first SUPER_ADMIN from the environment.
 *
 * The panel has no sign-up — by design (sign-in FR-010) — so a fresh
 * environment has a login form and nobody able to use it. This closes that
 * gap, and nothing else: it is not a general account-management tool.
 *
 * **Not a migration.** A migration would put the password hash in git forever
 * and make it identical on every environment that ever runs it, including a
 * dev server facing the internet. Reading it from the environment keeps the
 * secret with the deployment rather than with the source.
 *
 * Idempotent in the strong sense: if the address already exists, the row is
 * left completely alone — the password is NOT reset. Re-running a seed must
 * never be a way to take over an existing account.
 */
export async function seedAdmin(db: PostgresJsDatabase): Promise<void> {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    const fullName = process.env.SEED_ADMIN_NAME?.trim() || 'Super Admin';

    if (!email || !password) {
        // Silence would be worse than a no-op: somebody running this and
        // seeing nothing happen needs to know it was the missing variables,
        // not a failure they should investigate.
        console.log('[seed:admin] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — nothing to do');
        return;
    }

    // A weak password here is not a small problem: this account can read every
    // user record. The check is crude on purpose — the full policy lives in
    // @dns/validation, and importing it would make @dns/database depend on the
    // validation package for one branch.
    if (password.length < 12) {
        throw new Error('[seed:admin] SEED_ADMIN_PASSWORD must be at least 12 characters');
    }

    const [existing] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);

    if (existing) {
        console.log(`[seed:admin] ${email} already exists — left untouched`);
        return;
    }

    await db.insert(admins).values({
        email,
        passwordHash: await hash(password, ADMIN_AUTH_POLICY.bcryptRounds),
        fullName,
        role: AdminRole.SuperAdmin,
    });

    console.log(`[seed:admin] created SUPER_ADMIN ${email}`);
}
